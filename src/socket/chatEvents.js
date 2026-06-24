const { CHAT, CHATMESSAGE, USERSTATUS } = require("../model/modelIndex");
const mongoose = require("mongoose");
const moment = require("moment");
const { createLog } = require("../utils/createLog");

const allowedMessageTypes = ["text", "image", "file"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAuthorizedChat = ({
  chatId,
  userId,
  organizationId,
  activeOnly = false,
  populateParticipants = false,
}) => {
  if (!isValidObjectId(chatId)) {
    return null;
  }

  const query = {
    _id: chatId,
    $or: [{ participantOne: userId }, { participantTwo: userId }],
    organizationId,
  };

  if (activeOnly) {
    query.isActive = true;
  }

  let dbQuery = CHAT.findOne(query);

  if (populateParticipants) {
    dbQuery = dbQuery.populate([
      {
        path: "participantOne",
        select: "_id fullName profilePicture employeeCode",
      },
      {
        path: "participantTwo",
        select: "_id fullName profilePicture employeeCode",
      },
    ]);
  }

  return dbQuery;
};

const setupChatEvents = (io, socket) => {
  const userId = socket.user.id;
  const organizationId = socket.organizationId;

  const emitSocketError = (message) => {
    socket.emit("error", { message });
  };

  const markUserOnline = async () => {
    console.log("MARK ONLINE", {
      userId,
      socketId: socket.id,
    });
    const now = moment().toDate();

    const isUserStatusExists = await USERSTATUS.findOne({
      userId,
    })
      .select("_id")
      .lean();

    if (isUserStatusExists) {
      await USERSTATUS.updateOne(
        { userId },
        {
          $set: {
            isOnline: true,
            lastSeen: now,
            socketId: socket.id,
          },
          $addToSet: {
            socketIds: socket.id,
          },
        },
      );
    } else {
      await USERSTATUS.create({
        userId,
        isOnline: true,
        lastSeen: now,
        socketId: socket.id,
        socketIds: [socket.id],
      });
    }

    socket.join(`org:${organizationId}`);

    io.to(`org:${organizationId}`).emit("user:status-changed", {
      userId,
      isOnline: true,
      timestamp: now,
    });
  };

  const removeSocketFromPresence = async () => {
    const isUserStatusExists = await USERSTATUS.findOne({
      userId,
    });

    if (!isUserStatusExists) {
      return false;
    }

    await USERSTATUS.updateOne(
      { userId },
      {
        $pull: {
          socketIds: socket.id,
        },
      },
    );

    const updatedUserStatus = await USERSTATUS.findOne({
      userId,
    }).lean();

    if (updatedUserStatus?.socketIds?.length) {
      await USERSTATUS.updateOne(
        { userId },
        {
          $set: {
            socketId:
              updatedUserStatus.socketIds[
                updatedUserStatus.socketIds.length - 1
              ],
          },
        },
      );

      return false;
    }

    const now = moment().toDate();

    await USERSTATUS.updateOne(
      { userId },
      {
        $set: {
          isOnline: false,
          lastSeen: now,
          socketId: null,
        },
      },
    );

    io.to(`org:${organizationId}`).emit("user:status-changed", {
      userId,
      isOnline: false,
      lastSeen: now,
    });

    return true;
  };
  markUserOnline().catch((error) => {
    console.error("Error marking user online", error);
  });

  socket.on("user:online", async () => {
    try {
      await markUserOnline();
      console.log(`User ${userId} connected`);
    } catch (error) {
      console.error("Error in user:online", error);
    }
  });

  socket.on("chat:join", async (data) => {
    try {
      const { chatId } = data || {};

      const chat = await getAuthorizedChat({
        chatId,
        userId,
        organizationId,
      });

      if (!chat) {
        emitSocketError("You are not part of this chat");
        return;
      }

      socket.join(`chat:${chatId}`);

      io.to(`chat:${chatId}`).emit("chat:user-joined", {
        chatId,
        userId,
        timestamp: moment().toDate(),
      });

      console.log(`User ${userId} joined chat ${chatId}`);
    } catch (error) {
      console.error("Error in chat:join", error);
      emitSocketError(error.message);
    }
  });

  socket.on("message:send", async (data) => {
    try {
      const { chatId, message, messageType = "text", fileData } = data || {};
      const normalizedMessage =
        typeof message === "string" ? message.trim() : "";

      if (!allowedMessageTypes.includes(messageType)) {
        emitSocketError("Invalid message type");
        return;
      }

      if (!normalizedMessage || normalizedMessage.length > 5000) {
        emitSocketError("Message must be between 1 and 5000 characters");
        return;
      }

      const chat = await getAuthorizedChat({
        chatId,
        userId,
        organizationId,
        activeOnly: true,
        populateParticipants: true,
      });

      if (!chat) {
        emitSocketError("Chat not found");
        return;
      }

      const receiverId =
        chat.participantOne._id.toString() === userId
          ? chat.participantTwo._id
          : chat.participantOne._id;

      const chatMessage = await CHATMESSAGE.create({
        chatId,
        senderId: userId,
        receiverId,
        message: normalizedMessage,
        messageType,
        fileData: messageType !== "text" ? fileData : undefined,
      });

      const messageWithSender = await CHATMESSAGE.findById(
        chatMessage._id,
      ).populate({
        path: "senderId",
        select: "_id fullName profilePicture employeeCode",
      });

      await CHAT.updateOne(
        { _id: chatId },
        {
          $set: {
            lastMessage: {
              text: normalizedMessage,
              timestamp: moment().toDate(),
            },
            isDeletedByOne: false,
            isDeletedByTwo: false,
            isActive: true,
          },
        },
      );

      io.to(`chat:${chatId}`).emit("message:receive", {
        _id: messageWithSender._id,
        chatId,
        message: normalizedMessage,
        messageType,
        fileData: messageType !== "text" ? fileData : undefined,
        sender: {
          _id: messageWithSender.senderId._id,
          fullName: messageWithSender.senderId.fullName,
          profilePicture: messageWithSender.senderId.profilePicture,
          employeeCode: messageWithSender.senderId.employeeCode,
        },
        createdAt: messageWithSender.createdAt,
        isRead: false,
      });

      await createLog({
        userId,
        tableName: "chatMessage",
        recordId: chatMessage._id,
        action: "CREATE",
        newRecord: chatMessage.toObject(),
      });

      socket.emit("message:sent", {
        messageId: messageWithSender._id,
        timestamp: messageWithSender.createdAt,
      });
    } catch (error) {
      console.error("Error in message:send", error);
      emitSocketError(error.message);
    }
  });

  socket.on("message:typing", async (data) => {
    try {
      const { chatId } = data || {};
      const chat = await getAuthorizedChat({
        chatId,
        userId,
        organizationId,
        activeOnly: true,
      });

      if (!chat) {
        emitSocketError("Chat not found");
        return;
      }

      socket.to(`chat:${chatId}`).emit("message:user-typing", {
        userId,
        chatId,
        timestamp: moment().toDate(),
      });
    } catch (error) {
      console.error("Error in message:typing", error);
    }
  });

  socket.on("message:stop-typing", async (data) => {
    try {
      const { chatId } = data || {};
      const chat = await getAuthorizedChat({
        chatId,
        userId,
        organizationId,
        activeOnly: true,
      });

      if (!chat) {
        emitSocketError("Chat not found");
        return;
      }

      socket.to(`chat:${chatId}`).emit("message:user-stopped-typing", {
        userId,
        chatId,
      });
    } catch (error) {
      console.error("Error in message:stop-typing", error);
    }
  });

  socket.on("message:mark-read", async (data) => {
    try {
      const { chatId, messageIds } = data || {};
      const chat = await getAuthorizedChat({
        chatId,
        userId,
        organizationId,
      });

      if (!chat) {
        emitSocketError("Chat not found");
        return;
      }

      if (
        messageIds &&
        (!Array.isArray(messageIds) ||
          messageIds.some((id) => !isValidObjectId(id)))
      ) {
        emitSocketError("Invalid message ids");
        return;
      }

      const messageQuery = {
        chatId,
        receiverId: userId,
        isRead: false,
        isDeleted: false,
      };

      if (messageIds?.length) {
        messageQuery._id = { $in: messageIds };
      }

      const readAt = moment().toDate();
      const result = await CHATMESSAGE.updateMany(messageQuery, {
        $set: {
          isRead: true,
          readAt,
        },
      });

      io.to(`chat:${chatId}`).emit("message:marked-read", {
        userId,
        chatId,
        messageIds,
        modifiedCount: result.modifiedCount,
        readAt,
      });
    } catch (error) {
      console.error("Error in message:mark-read", error);
    }
  });

  socket.on("message:get-unread-count", async () => {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const unreadResult = await CHATMESSAGE.aggregate([
        {
          $match: {
            receiverId: userObjectId,
            isRead: false,
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chatId",
            foreignField: "_id",
            as: "chat",
          },
        },
        { $unwind: "$chat" },
        {
          $match: {
            "chat.organizationId": organizationId,
            "chat.isActive": true,
            $or: [
              {
                "chat.participantOne": userObjectId,
                "chat.isDeletedByOne": false,
              },
              {
                "chat.participantTwo": userObjectId,
                "chat.isDeletedByTwo": false,
              },
            ],
          },
        },
        { $count: "unreadCount" },
      ]);

      socket.emit("message:unread-count", {
        unreadCount: unreadResult[0]?.unreadCount || 0,
        timestamp: moment().toDate(),
      });
    } catch (error) {
      console.error("Error in message:get-unread-count", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      const isOffline = await removeSocketFromPresence();

      if (isOffline) {
        console.log(`User ${userId} disconnected`);
      }
    } catch (error) {
      console.error("Error in disconnect", error);
    }
  });

  socket.on("user:offline", async () => {
    try {
      socket.leave(`org:${organizationId}`);
      await removeSocketFromPresence();
    } catch (error) {
      console.error("Error in user:offline", error);
    }
  });
};

module.exports = { setupChatEvents };

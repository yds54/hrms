const moment = require("moment");
const { CHAT, CHATMESSAGE, USER, USERSTATUS } = require("../model/modelIndex");
const { successResponse } = require("../utils/sucess");
const { AppError } = require("../utils/error");
const { paginate } = require("../utils/pagination");
const { createLog } = require("../utils/createLog");

const chatParticipantPopulate = [
  {
    path: "participantOne",
    select: "fullName email employeeCode profilePicture",
  },
  {
    path: "participantTwo",
    select: "fullName email employeeCode profilePicture",
  },
];

const getParticipantKey = (firstUserId, secondUserId) =>
  [firstUserId, secondUserId]
    .map((id) => id.toString())
    .sort()
    .join(":");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatUserStatus = (userStatus) =>
  userStatus
    ? {
        isOnline: userStatus.isOnline,
        lastSeen: userStatus.lastSeen,
      }
    : { isOnline: false, lastSeen: null };

exports.getOrCreateChat = async (req, res, next) => {
  try {
    const { user, params } = req;
    const { userId } = params;

    if (userId === user.id) {
      throw new AppError("You cannot chat with yourself", 400);
    }

    const isRecipientUserExists = await USER.findOne({
      _id: userId,
      isDeleted: false,
      isLeft: false,
      status: "active",
      organizationId: user.organizationId,
    }).select("_id organizationId");

    if (!isRecipientUserExists) {
      throw new AppError("User not found with given Id", 404);
    }

    const participantKey = getParticipantKey(user.id, userId);
    const chatQuery = {
      organizationId: user.organizationId,
      $or: [
        { participantKey },
        { participantOne: user.id, participantTwo: userId },
        { participantOne: userId, participantTwo: user.id },
      ],
    };

    let chat = await CHAT.findOne(chatQuery);
    let isNewChat = false;

    if (!chat) {
      try {
        chat = await CHAT.create({
          participantOne: user.id,
          participantTwo: userId,
          participantKey,
          organizationId: user.organizationId,
        });
        isNewChat = true;
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }

        chat = await CHAT.findOne({
          participantKey,
          organizationId: user.organizationId,
        });
      }
    }

    if (!chat) {
      throw new AppError("Unable to retrieve chat", 409);
    }

    if (!isNewChat) {
      await CHAT.updateOne(
        { _id: chat._id },
        {
          $set: {
            participantKey,
            isActive: true,
            isDeletedByOne: false,
            isDeletedByTwo: false,
          },
        },
      );

      chat = await CHAT.findById(chat._id);
    }

    chat = await chat.populate(chatParticipantPopulate);

    if (isNewChat) {
      await createLog({
        userId: user._id,
        tableName: "chat",
        recordId: chat._id,
        action: "CREATE",
        newRecord: chat.toObject(),
      });
    }

    const otherParticipantId =
      chat.participantOne._id.toString() === user.id
        ? chat.participantTwo._id
        : chat.participantOne._id;

    const userStatus = await USERSTATUS.findOne({
      userId: otherParticipantId,
    });

    return successResponse(res, 200, "Chat retrieved successfully", {
      data: {
        ...chat.toObject(),
        otherUserStatus: formatUserStatus(userStatus),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getChatMessages = async (req, res, next) => {
  try {
    const { user, params, query } = req;
    const { chatId } = params;
    const { page, limit } = query;

    const isChatExists = await CHAT.findOne({
      _id: chatId,
      organizationId: user.organizationId,
      isActive: true,
      $or: [
        { participantOne: user.id, isDeletedByOne: false },
        { participantTwo: user.id, isDeletedByTwo: false },
      ],
    });

    if (!isChatExists) {
      throw new AppError("Chat not found or you are not a participant", 404);
    }

    const { data, pagination } = await paginate({
      model: CHATMESSAGE,
      query: {
        chatId,
        isDeleted: false,
      },
      populate: [
        {
          path: "senderId",
          select: "fullName employeeCode profilePicture email",
          options: { lean: true },
        },
        {
          path: "receiverId",
          select: "fullName employeeCode profilePicture email",
          options: { lean: true },
        },
      ],
      page: +page,
      limit: +limit,
      sort: { createdAt: 1 },
    });

    return successResponse(res, 200, "Messages retrieved successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const { user, query } = req;
    const { page, limit, search } = query;

    const ownershipConditions = [
      { participantOne: user.id, isDeletedByOne: false },
      { participantTwo: user.id, isDeletedByTwo: false },
    ];
    const whereCondition = {
      organizationId: user.organizationId,
      isActive: true,
      $and: [{ $or: ownershipConditions }],
    };

    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search.trim()), "i");
      const matchingUsers = await USER.find({
        _id: { $ne: user._id },
        organizationId: user.organizationId,
        isDeleted: false,
        isLeft: false,
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { employeeCode: searchRegex },
        ],
      }).select("_id");

      const matchingUserIds = matchingUsers.map(
        (matchingUser) => matchingUser._id,
      );

      whereCondition.$and.push({
        $or: [
          { participantOne: { $in: matchingUserIds } },
          { participantTwo: { $in: matchingUserIds } },
          { "lastMessage.text": searchRegex },
        ],
      });
    }

    const { data, pagination } = await paginate({
      model: CHAT,
      query: whereCondition,
      populate: [
        {
          path: "participantOne",
          select: "fullName email employeeCode profilePicture",
          options: { lean: true },
        },
        {
          path: "participantTwo",
          select: "fullName email employeeCode profilePicture",
          options: { lean: true },
        },
      ],
      page: +page,
      limit: +limit,
      sort: { updatedAt: -1 },
    });

    const otherParticipantIds = data.map((chat) =>
      chat.participantOne._id.toString() === user.id
        ? chat.participantTwo._id
        : chat.participantOne._id,
    );

    const userStatuses = await USERSTATUS.find({
      userId: { $in: otherParticipantIds },
    });
    const statusByUserId = new Map(
      userStatuses.map((status) => [status.userId.toString(), status]),
    );

    const formattedData = data.map((chat) => {
      const otherParticipant =
        chat.participantOne._id.toString() === user.id
          ? chat.participantTwo
          : chat.participantOne;
      const userStatus = statusByUserId.get(otherParticipant._id.toString());

      return {
        chatId: chat._id,
        otherUser: otherParticipant,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
        otherUserStatus: formatUserStatus(userStatus),
      };
    });

    return successResponse(res, 200, "Conversations retrieved successfully", {
      data: formattedData,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteChat = async (req, res, next) => {
  try {
    const { user, params } = req;
    const { chatId } = params;

    const isChatExists = await CHAT.findOne({
      _id: chatId,
      organizationId: user.organizationId,
      $or: [{ participantOne: user.id }, { participantTwo: user.id }],
    }).lean();

    if (!isChatExists) {
      throw new AppError("Chat not found or you are not a participant", 404);
    }

    const updateData = {};

    if (isChatExists.participantOne.toString() === user.id) {
      updateData.isDeletedByOne = true;
    } else {
      updateData.isDeletedByTwo = true;
    }

    if (
      (isChatExists.participantOne.toString() === user.id &&
        isChatExists.isDeletedByTwo) ||
      (isChatExists.participantTwo.toString() === user.id &&
        isChatExists.isDeletedByOne)
    ) {
      updateData.isActive = false;
    }

    await CHAT.updateOne(
      { _id: chatId },
      {
        $set: updateData,
      },
    );

    const updatedChat = await CHAT.findById(chatId).lean();

    await createLog({
      userId: user._id,
      tableName: "chat",
      recordId: chatId,
      action: "UPDATE",
      oldRecord: isChatExists,
      newRecord: updatedChat,
    });

    return successResponse(res, 200, "Chat deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const { user } = req;

    const unreadResult = await CHATMESSAGE.aggregate([
      {
        $match: {
          receiverId: user._id,
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
          "chat.organizationId": user.organizationId,
          "chat.isActive": true,
          $or: [
            { "chat.participantOne": user._id, "chat.isDeletedByOne": false },
            { "chat.participantTwo": user._id, "chat.isDeletedByTwo": false },
          ],
        },
      },
      { $count: "unreadCount" },
    ]);

    return successResponse(res, 200, "Unread count retrieved successfully", {
      unreadCount: unreadResult[0]?.unreadCount || 0,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserStatus = async (req, res, next) => {
  try {
    const { params, user } = req;
    const { userId } = params;

    const isUserExists = await USER.findOne({
      _id: userId,
      organizationId: user.organizationId,
      isDeleted: false,
      isLeft: false,
    }).select("_id");

    if (!isUserExists) {
      throw new AppError("User not found or is not in your organization", 404);
    }

    const userStatus = await USERSTATUS.findOne({
      userId,
    });
    console.log({
      requestedUserId: userId,
      foundStatus: userStatus,
    });
    return successResponse(res, 200, "User status retrieved successfully", {
      data: {
        userId,
        ...formatUserStatus(userStatus),
      },
    });
  } catch (error) {
    next(error);
  }
};

const {
  TICKETCOMMENT,
  TICKET,
  TICKETACTIVITY,
} = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { ROLES } = require("../utils/enum");
const {
  uploadMultipleFilesSingleField,
  deleteMultipleFromCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinaryHelper");
const { formatComment } = require("../utils/cloudinaryFormatUrl");

//================ CREATE COMMENT =================
exports.createComment = async (req, res, next) => {
  try {
    const {
      user: { _id: userId, role },
      params: { ticketId },
      body: { comment },
      files,
    } = req;

    const isTicketExists = await TICKET.findOne({
      _id: ticketId,
      isDeleted: false,
    }).select("createdBy assignedTo");

    if (!isTicketExists) {
      throw new AppError("Ticket not found with given id", 404);
    }

    // owner, assignee, admin allowed
    const isRoleAllowed =
      isTicketExists.createdBy.toString() === userId.toString() ||
      isTicketExists.assignedTo?.some(
        (id) => id.toString() === userId.toString(),
      ) ||
      role === ROLES.ADMIN;

    if (!isRoleAllowed) {
      throw new AppError("You are not allowed to comment on this ticket", 403);
    }

    let attachFile = [];
    if (files?.length) {
      const uploadedRawFiles = await uploadMultipleFilesSingleField(files, {
        folder: `comments/${ticketId}/${userId}`,
      });
      attachFile = uploadedRawFiles.map(({ fileName, fileType, size }) => ({
        fileName,
        fileType,
        size,
      }));
    }

    const comments = await TICKETCOMMENT.create({
      ticketId,
      comment,
      attachFile,
      createdBy: userId,
    });

    await TICKETACTIVITY.create({
      ticketId,
      field: "created",
      oldValue: null,
      newValue: "Created Comment",
      changedBy: userId,
    });

    return successResponse(res, 201, "Comment added Success", comments);
  } catch (err) {
    next(err);
  }
};

//================ GET COMMENTS =================
exports.getComments = async (req, res, next) => {
  try {
    const {
      params: { ticketId },
      user: { _id: userId, role },
    } = req;

    const isTicketExists = await TICKET.findOne({
      _id: ticketId,
      isDeleted: false,
    }).select("createdBy assignedTo");

    if (!isTicketExists) {
      throw new AppError("Ticket not found with given Ticket Id", 404);
    }

    // owner , assignee , admin allowed
    const isRoleAllowed =
      isTicketExists.createdBy.toString() === userId.toString() ||
      isTicketExists.assignedTo?.some(
        (id) => id.toString() === userId.toString(),
      ) ||
      role === ROLES.ADMIN;

    if (!isRoleAllowed) {
      throw new AppError("You are not allowed to to view comments", 403);
    }

    const comments = await TICKETCOMMENT.find({
      ticketId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate([
        {
          path: "createdBy",
          select: "name profilePicture",
          match: { isDeleted: false },
        },
      ])
      .lean();

    const formattedComments = comments.map(formatComment);

    return successResponse(res, 200, "Comments fetched", {
      comments: formattedComments,
    });
  } catch (err) {
    next(err);
  }
};

//=============== DELETE COMMENTS ===============
exports.deleteComment = async (req, res, next) => {
  try {
    const {
      user: { _id: userId },
      params: { commentId },
    } = req;

    const isCommentExists = await TICKETCOMMENT.findOne({
      _id: commentId,
      isDeleted: false,
    });

    if (!isCommentExists) {
      throw new AppError("Comment not found with given CommentId", 404);
    }

    // check ticket
    const isTicketExists = await TICKET.findOne({
      _id: isCommentExists.ticketId,
      isDeleted: false,
    }).select("_id");

    if (!isTicketExists) {
      throw new AppError("Ticket not found with given comment Id", 404);
    }

    // only comment owner can delete
    if (isCommentExists.createdBy.toString() !== userId.toString()) {
      throw new AppError("You can delete only your own comment", 403);
    }

    // delete files from cloiudinary
    if (isCommentExists.attachFile?.length) {
      const publicIds = isCommentExists.attachFile.map(
        (file) =>
          `comments/${isCommentExists.ticketId}/${isCommentExists.createdBy}/${file.fileName}`,
      );
      await deleteMultipleFromCloudinary(publicIds);
    }

    await TICKETACTIVITY.create({
      ticketId: isCommentExists.ticketId,
      field: "deleted",
      oldValue: isCommentExists.comment || "Comment",
      newValue: "Deleted Comment",
      changedBy: userId,
    });

    await TICKETCOMMENT.updateOne(
      { _id: commentId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
    );

    return successResponse(res, 200, "Comment deleted successfully");
  } catch (err) {
    next(err);
  }
};

//========= DELETE SINGLE FILE FROM COMMENT =========
exports.deleteSingleCommentFile = async (req, res, next) => {
  try {
    const {
      user: { _id: userId },
      params: { commentId },
      body: { fileName },
    } = req;

    if (!fileName) {
      throw new AppError("fileName is required for delete single file", 422);
    }

    const comment = await TICKETCOMMENT.findOne({
      _id: commentId,
      isDeleted: false,
    });
    if (!comment) {
      throw new AppError("Comment not found with given Id", 404);
    }

    if (comment.createdBy.toString() !== userId.toString()) {
      throw new AppError("You are not authorized to delete file", 403);
    }

    const fileExists = comment.attachFile.some((f) => f.fileName === fileName);
    if (!fileExists) {
      throw new AppError("File not found for given fileName in comment", 404);
    }

    // delete single file from cloudinary
    await deleteFromCloudinary(
      `comments/${comment.ticketId}/${comment.createdBy}/${fileName}`,
    );

    await TICKETCOMMENT.updateOne(
      { _id: commentId },
      {
        $pull: {
          attachFile: { fileName },
        },
      },
    );

    await TICKETACTIVITY.create({
      ticketId: comment.ticketId,
      field: "deleted",
      oldValue: fileName,
      newValue: "1 attachment deleted",
      changedBy: userId,
    });

    return successResponse(res, 200, "File deleted successfully");
  } catch (err) {
    next(err);
  }
};

const { TICKETCOMMENT, TICKET } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { ROLES } = require("../utils/enum");

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
      isTicketExists.assignedTo.toString() === userId.toString() ||
      role === ROLES.ADMIN;

    if (!isRoleAllowed) {
      throw new AppError("You are not allowed to comment on this ticket", 403);
    }

    const attachFile =
      files?.map((file) => `/uploads/tickets/${file.filename}`) || [];

    const comments = await TICKETCOMMENT.create({
      ticketId,
      comment,
      attachFile,
      createdBy: userId,
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
      isTicketExists.assignedTo.toString() === userId.toString() ||
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

    return successResponse(res, 200, "Comments fetched", { comments });
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

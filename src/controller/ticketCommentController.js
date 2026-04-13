const { TICKETCOMMENT, TICKET } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");

//================ CREATE COMMENT =================
exports.createComment = async (req, res, next) => {
  try {
    const {
      user: { _id: userId },
      params: { ticketId },
      body: { comment },
      files,
    } = req;

    const isTicketExists = await TICKET.findOne({
      _id: ticketId,
      isDeleted: false,
    });

    if (!isTicketExists) {
      throw new AppError("Ticket not found with given id", 404);
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
    const { ticketId } = req.params;

    const comments = await TICKETCOMMENT.find({
      ticketId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate([{ path: "createdBy", select: "name profilePicture" }])
      .lean();

    return successResponse(res, 200, "Comments fetched", { comments });
  } catch (err) {
    next(err);
  }
};

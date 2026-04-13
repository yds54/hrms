const { USER, TICKET } = require("../model/modelIndex");
const { ROLES , TICKET_FILTER} = require("../utils/enum");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { getProjection } = require("../utils/projection");

const ALLOWED_ROLES = [
  ROLES.ADMIN,
  ROLES.HR,
  ROLES.HR_RECRUITER,
  ROLES.PROJECT_MANAGER,
  ROLES.TEAM_LEAD,
];

//========================== CREATE TICKET ==========================
exports.createTicket = async (req, res, next) => {
  try {
    const { _id: createdBy } = req.user;
    const { assignedTo } = req.body;

    const assignee = await USER.findOne(
      { _id: assignedTo, isDeleted: false },
      { role: 1 },
    );

    if (!assignee || !ALLOWED_ROLES.includes(assignee.role)) {
      throw new AppError(
        !assignee
          ? "Assigned user not found"
          : "You cannot assign ticket to this role",
        !assignee ? 404 : 400,
      );
    }

    const files =
      req.files?.map((file) => `/uploads/tickets/${file.filename}`) || [];

    const ticket = await TICKET.create({
      ...req.body,
      attachFile: files,
      createdBy,
    });

    return successResponse(res, 201, "Ticket created", ticket);
  } catch (err) {
    next(err);
  }
};

//========================== DISPLAY TICKET ==========================
exports.getTickets = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    let { startDate, endDate, isArchived, filter = "All" } = req.query;
    const _where = { isDeleted: false, isArchived: isArchived};

    if (filter === TICKET_FILTER.MY_TICKETS) {
      _where.createdBy = userId;
    } else if (filter === TICKET_FILTER.ASSIGNED_TO_ME) {
      _where.assignedTo = userId;
    } else {
      _where.$or = [{ createdBy: userId }, { assignedTo: userId }];
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      _where.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    const data = await TICKET.find(_where)
      .sort({ createdAt: -1 })
      .select(getProjection())
      .populate([
        { path: "assignedTo", select: "name" },
        { path: "createdBy", select: "name" },
      ])
      .lean();

    return successResponse(res, 200, "Tickets fetched", { data });
  } catch (err) {
    next(err);
  }
};

//========================== EDIT TICKET ==========================
exports.updateTicket = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { id } = req.params;

    const ticket = await TICKET.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    if (ticket.createdBy.toString() !== userId.toString()) {
      throw new AppError("Unauthorized", 403);
    }

    if (req.files?.length) {
      const files = req.files.map(
        (file) => `/uploads/tickets/${file.filename}`,
      );
      req.body.attachFile = files;
    }

    await TICKET.updateOne({ _id: id }, { $set: req.body });

    return successResponse(res, 200, "Ticket updated");
  } catch (err) {
    next(err);
  }
};

//========================== DELETE TICKET ==========================
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await TICKET.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    await TICKET.updateOne({ _id: id }, { $set: { isDeleted: true , deletedAt: new Date(), } });

    return successResponse(res, 200, "Ticket deleted successfully");
  } catch (err) {
    next(err);
  }
};

const { USER, TICKET, TICKETACTIVITY } = require("../model/modelIndex");
const { ROLES, TICKET_FILTER, TICKET_STATUS } = require("../utils/enum");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { getProjection } = require("../utils/projection");
const { getDayRange, dateSearchQuery } = require("../utils/dateFormat");

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

    const isAssigneeExists = await USER.findOne(
      { _id: assignedTo, isDeleted: false },
      { role: 1 },
    );

    if (!isAssigneeExists || !ALLOWED_ROLES.includes(isAssigneeExists.role)) {
      throw new AppError(
        !isAssigneeExists
          ? "Assigned user not found"
          : "You cannot assign ticket to this role",
        !isAssigneeExists ? 404 : 400,
      );
    }

    const files =
      req.files?.map((file) => `/uploads/tickets/${file.filename}`) || [];

    const ticket = await TICKET.create({
      ...req.body,
      attachFile: files,
      createdBy,
    });

    await TICKETACTIVITY.create({
      ticketId: ticket._id,
      field: "created",
      oldValue: null,
      newValue: "Ticket created",
      changedBy: createdBy,
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
    let { startDate, endDate, isArchived, filter = "All", search } = req.query;
    const _where = { isDeleted: false, isArchived: isArchived };

    if (filter === TICKET_FILTER.MY_TICKETS) {
      _where.createdBy = userId;
    } else if (filter === TICKET_FILTER.ASSIGNED_TO_ME) {
      _where.assignedTo = userId;
    } else {
      _where.$or = [{ createdBy: userId }, { assignedTo: userId }];
    }

    if (startDate && endDate) {
      const { startOfDay: start } = getDayRange(startDate);
      const { endOfDay: end } = getDayRange(endDate);

      _where.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    //search
    if (search) {
      const fields = ["title", "content"];
      const searchCondition = fields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));

      // date search
      const dateQuery = dateSearchQuery("createdAt", search);
      if (dateQuery) {
        searchCondition.push(dateQuery);
      }
      _where.$and = [{ $or: searchCondition }];
    }

    const data = await TICKET.find(_where)
      .sort({ createdAt: -1 })
      .select(getProjection())
      .populate([
        { path: "assignedTo", select: "name", match: { isDeleted: false } },
        { path: "createdBy", select: "name", match: { isDeleted: false } },
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
    const payload = { ...req.body };

    const isTicketExists = await TICKET.findOne({ _id: id, isDeleted: false });

    if (!isTicketExists) {
      throw new AppError("Ticket not found with given id", 404);
    }

    if (isTicketExists.createdBy.toString() !== userId.toString()) {
      throw new AppError("Unauthorized", 403);
    }

    // status update
    if (payload.status) {
      if (
        isTicketExists.status === TICKET_STATUS.COMPLETED &&
        payload.status !== TICKET_STATUS.TODO
      ) {
        throw new AppError("You can only Reopen Ticket", 400);
      }
      if (
        isTicketExists.status === TICKET_STATUS.TODO &&
        payload.status !== TICKET_STATUS.TODO
      ) {
        throw new AppError("Cannot change To Do status", 400);
      }
    }

    if (req.files?.length) {
      payload.attachFile = req.files.map(
        (file) => `/uploads/tickets/${file.filename}`,
      );
    }

    //insert activity
    const trackFields = [
      "title",
      "dueDate",
      "priority",
      "content",
      "isArchived",
      "status",
    ];

    const activities = trackFields.reduce((acc, field) => {
      const newVal = payload[field];
      if (newVal === undefined) return acc;
      const oldVal = isTicketExists[field];

      const format = (value) =>
        field === "dueDate" && value ? new Date(value).toISOString() : value;

      if (String(format(oldVal)) !== String(format(newVal))) {
        acc.push({
          ticketId: id,
          field,
          oldValue: format(oldVal),
          newValue: format(newVal),
          changedBy: userId,
        });
      }
      return acc;
    }, []);

    if (activities.length) {
      await TICKETACTIVITY.insertMany(activities);
    }

    await TICKET.updateOne({ _id: id }, { $set: payload });

    return successResponse(res, 200, "Ticket updated");
  } catch (err) {
    next(err);
  }
};

//=========================== DISPLAY TICKET ACTIVITY ==========================
exports.getTicketActivity = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const isTicketExists = await TICKET.findOne({
      _id: ticketId,
      isDeleted: false,
    }).select("_id");

    if (!isTicketExists) {
      throw new AppError("Ticket not found with given Id", 404);
    }

    const activity = await TICKETACTIVITY.find({ ticketId })
      .sort({ createdAt: -1 })
      .populate([
        {
          path: "changedBy",
          select: "name profilePicture",
          match: { isDeleted: false },
        },
      ])
      .lean();

    return successResponse(res, 200, "Activity fetched", { activity });
  } catch (err) {
    next(err);
  }
};

//========================== DELETE TICKET ==========================
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isTicketExists = await TICKET.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isTicketExists) {
      throw new AppError("Ticket not found with given Id", 404);
    }

    await TICKET.updateOne(
      { _id: id },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );

    return successResponse(res, 200, "Ticket deleted successfully");
  } catch (err) {
    next(err);
  }
};

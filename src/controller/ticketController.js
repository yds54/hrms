const mongoose = require("mongoose");
const {
  USER,
  TICKET,
  TICKETACTIVITY,
  TICKETCOMMENT,
} = require("../model/modelIndex");
const { ROLES, TICKET_FILTER, TICKET_STATUS } = require("../utils/enum");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { getProjection } = require("../utils/projection");
const { getDayRange, dateSearchQuery } = require("../utils/dateFormat");

const ALLOWED_ROLES = [
  ROLES.ADMIN,
  ROLES.USER,
  ROLES.HR,
  ROLES.HR_RECRUITER,
  ROLES.PROJECT_MANAGER,
  ROLES.TEAM_LEAD,
];

//========================== CREATE TICKET ==========================
exports.createTicket = async (req, res, next) => {
  try {
    const { _id: createdBy, role } = req.user;
    let { assignedTo } = req.body;

    const isPrivileged = [ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER].includes(
      role,
    );

    assignedTo = Array.isArray(assignedTo)
      ? assignedTo
      : assignedTo
        ? [assignedTo]
        : [];

    // user - auto assign all HRs
    if (role === ROLES.USER) {
      if (assignedTo.length) {
        throw new AppError("Not allowed to assign ticket manually", 403);
      }
      const hrUsers = await USER.find({
        role: ROLES.HR,
        isDeleted: false,
      }).select("_id");
      if (!hrUsers.length) {
        throw new AppError("No HR found", 404);
      }
      assignedTo = hrUsers.map((user) => user._id);
    }

    const assignees = await USER.find({
      _id: { $in: assignedTo },
      isDeleted: false,
    }).select("role");

    if (assignees.length !== assignedTo.length) {
      throw new AppError("Some Assigned user not found", 404);
    }

    if (!isPrivileged) {
      const allHr = assignees.every((user) => user.role === ROLES.HR);
      if (!allHr) {
        throw new AppError("You can assign ticket only to HR", 403);
      }
    } else {
      const validRoles = assignees.every((user) =>
        ALLOWED_ROLES.includes(user.role),
      );

      if (!validRoles) {
        throw new AppError(
          "Ticket cannot be assigned to the selected role",
          403,
        );
      }
    }

    const files =
      req.files?.map((file) => `/uploads/tickets/${file.filename}`) || [];

    const ticket = await TICKET.create({
      ...req.body,
      assignedTo,
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
    const { _id: userId, role } = req.user;
    let { startDate, endDate, isArchived, filter = "All", search } = req.query;
    const _where = { isDeleted: false, isArchived: isArchived };

    const roleConditions = {
      [ROLES.ADMIN]: {}, // admin - all
      [ROLES.HR]: { assignedTo: userId }, // HR - assigned only
      default: {
        $or: [{ createdBy: userId }, { assignedTo: userId }],
      },
    };
    Object.assign(_where, roleConditions[role] || roleConditions.default);

    if (filter === TICKET_FILTER.MY_TICKETS) {
      _where.createdBy = userId;
      delete _where.assignedTo;
      delete _where.$or;
    } else if (filter === TICKET_FILTER.ASSIGNED_TO_ME) {
      _where.assignedTo = userId;
      delete _where.createdBy;
      delete _where.$or;
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
    const { _id: userId, role } = req.user;
    const { id } = req.params;
    const payload = { ...req.body };

    const isTicketExists = await TICKET.findOne({ _id: id, isDeleted: false });
    if (!isTicketExists) {
      throw new AppError("Ticket not found with given id", 404);
    }

    const isOwner = isTicketExists.createdBy.toString() === userId.toString();
    const isAdmin = role === ROLES.ADMIN;
    const isHR = role === ROLES.HR;
    const isAssignee = isTicketExists.assignedTo?.some(
      (id) => id.toString() === userId.toString(),
    );

    if (!isAdmin && !isOwner && !isAssignee && !isHR) {
      throw new AppError(
        "You are not Authorize user to update the Ticket.",
        403,
      );
    }

    const status = isTicketExists.status;
    let allowedFields = [];

    // role and status update rule
    if (isAdmin || isAssignee || isHR) {
      if (status === TICKET_STATUS.TODO || status === TICKET_STATUS.REOPEN) {
        allowedFields = null; // full access
      } else if (
        [TICKET_STATUS.INPROGRESS, TICKET_STATUS.ONHOLD].includes(status)
      ) {
        allowedFields = ["assignedTo", "priority", "status"];
      } else if (status === TICKET_STATUS.COMPLETED) {
        allowedFields = ["status"];

        if (
          payload.status &&
          ![TICKET_STATUS.COMPLETED, TICKET_STATUS.REOPEN].includes(
            payload.status,
          )
        ) {
          throw new AppError("Invalid status update for completed ticket", 400);
        }
      }
    } else if (isOwner) {
      if (status === TICKET_STATUS.TODO || status === TICKET_STATUS.REOPEN) {
        allowedFields = [
          "title",
          "dueDate",
          "priority",
          "content",
          "attachFile",
        ];
      } else if (
        [TICKET_STATUS.INPROGRESS, TICKET_STATUS.ONHOLD].includes(status)
      ) {
        allowedFields = ["priority"];
      } else if (status === TICKET_STATUS.COMPLETED) {
        allowedFields = ["status"];

        if (payload.status !== TICKET_STATUS.REOPEN) {
          throw new AppError("You can only reopen the ticket", 400);
        }
      }
    }

    // update isArchived
    if (
      [TICKET_STATUS.TODO, TICKET_STATUS.ONHOLD, TICKET_STATUS.REOPEN].includes(
        status,
      )
    ) {
      if (allowedFields !== null && !allowedFields.includes("isArchived")) {
        allowedFields.push("isArchived");
      }
    }

    // prevent user from updating assignedTo
    if (!isAdmin && !isHR && !isAssignee && payload.assignedTo) {
      delete payload.assignedTo;
      throw new AppError("You can't update assigned user", 400);
    }

    if (allowedFields !== null) {
      Object.keys(payload).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete payload[key];
        }
      });
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
    const { _id: userId, role } = req.user;
    const { id } = req.params;

    const isTicketExists = await TICKET.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isTicketExists || isTicketExists.isArchived) {
      throw new AppError(
        !isTicketExists
          ? "Ticket not found with given Id"
          : "Archived ticket cannot be deleted",
        !isTicketExists ? 404 : 400,
      );
    }

    // owner , assignee , admin allowed
    const isRoleAllowed =
      isTicketExists.createdBy.toString() === userId.toString() ||
      isTicketExists.assignedTo.toString() === userId.toString() ||
      role === ROLES.ADMIN;

    if (!isRoleAllowed) {
      throw new AppError("Not authorized to delete ticket", 403);
    }

    if (
      ![TICKET_STATUS.TODO, TICKET_STATUS.REOPEN].includes(
        isTicketExists.status,
      )
    ) {
      throw new AppError("Only ToDo or Reopen tickets can be deleted", 400);
    }

    //soft delete ticket related comment and it's activity
    await Promise.all([
      TICKET.updateOne(
        { _id: id },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      ),
      TICKETCOMMENT.updateMany(
        { ticketId: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      ),
      TICKETACTIVITY.updateMany(
        { ticketId: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      ),
    ]);

    return successResponse(res, 200, "Ticket deleted successfully");
  } catch (err) {
    next(err);
  }
};

//========================== GET TICKET BY USER ID ==========================
exports.getTicketByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const isUserExists = await USER.findOne({
      _id: userId,
      isDeleted: false,
    }).select("_id");

    if (!isUserExists) {
      throw new AppError("User not found with given Id", 404);
    }

    const data = await TICKET.find({
      isDeleted: false,
      isArchived: false,
      createdBy: userId,
    })
      .sort({ createdAt: -1 })
      .populate([
        { path: "assignedTo", select: "name", match: { isDeleted: false } },
        { path: "createdBy", select: "name", match: { isDeleted: false } },
      ])
      .lean();

    return successResponse(res, 200, "User tickets fetched", { data });
  } catch (err) {
    next(err);
  }
};

//========================== UPDATE ASSIGNEE ==========================
exports.updateAssignee = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { status, currentAssignee, newAssignee } = req.body;

    // check current assignee exists
    const isCurrentUserExists = await USER.findOne({
      _id: currentAssignee,
      isDeleted: false,
    }).select("_id");

    if (!isCurrentUserExists) {
      throw new AppError("Current assignee not found", 404);
    }

    // check new assignee exists
    const isNewUserExists = await USER.findOne({
      _id: newAssignee,
      isDeleted: false,
    }).select("_id");

    if (!isNewUserExists) {
      throw new AppError("New assignee not found", 404);
    }

    // find tickets
    const tickets = await TICKET.find({
      status,
      assignedTo: currentAssignee,
      isDeleted: false,
    }).select("_id assignedTo");

    if (!tickets.length) {
      throw new AppError("No tickets found for given criteria", 404);
    }

    const ticketIds = tickets.map((t) => t._id);

    // update tickets
    await TICKET.updateMany(
      { _id: { $in: ticketIds } },
      { $set: { assignedTo: newAssignee } },
    );

    // activity log
    const activities = ticketIds.map((id) => ({
      ticketId: id,
      field: "assignedTo",
      oldValue: currentAssignee,
      newValue: newAssignee,
      changedBy: userId,
    }));

    await TICKETACTIVITY.insertMany(activities);

    return successResponse(res, 200, "Assignee updated successfully");
  } catch (err) {
    next(err);
  }
};

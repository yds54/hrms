const { Joi } = require("express-validation");
const {
  PRIORITY_STATUS,
  TICKET_STATUS,
  TICKET_FILTER,
} = require("../utils/enum");

//========================== CREATE TICKET VALIDATION ==========================
exports.createTicketValidation = {
  body: Joi.object({
    title: Joi.string().trim().required(),
    assignedTo: Joi.array()
      .items(Joi.string().hex().length(24))
      .single()
      .optional(),
    dueDate: Joi.date().required(),
    priority: Joi.string()
      .valid(...Object.values(PRIORITY_STATUS))
      .optional(),
    content: Joi.string().trim().required(),
    attachFile: Joi.array().items(Joi.string()).optional(),
    status: Joi.string()
      .valid(...Object.values(TICKET_STATUS))
      .optional(),
  }),
};

//========================== DISPLAY TICKET VALIDATION ==========================
exports.getTicketValidation = {
  query: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    isArchived: Joi.boolean().optional(),
    filter: Joi.string()
      .valid(...Object.values(TICKET_FILTER))
      .default(TICKET_FILTER.ALL),
    search: Joi.string().optional(),
  }),
};

//========================== DISPLAY TICKET ACTIVITY VALIDATION ==========================
exports.getTicketActivityValidation = {
  params: Joi.object({
    ticketId: Joi.string().hex().length(24).required(),
  }),
};

//========================== EDIT TICKET VALIDATION ==========================
exports.updateTicketValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),

  body: Joi.object({
    title: Joi.string().trim().optional(),
    dueDate: Joi.date().optional(),
    priority: Joi.string()
      .valid(...Object.values(PRIORITY_STATUS))
      .optional(),
    content: Joi.string().trim().optional(),
    isArchived: Joi.boolean().optional(),
    status: Joi.string()
      .valid(...Object.values(TICKET_STATUS))
      .optional(),
    attachFile: Joi.array().items(Joi.string()).optional(),
  }),
};

//========================== DELETE TICKET VALIDATION ==========================
exports.deleteTicketValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

//========================== GET TICKET BY USER ID VALIDATION ==========================
exports.getTicketByUserIdValidation = {
  params: Joi.object({
    userId: Joi.string().hex().length(24).required(),
  }),
};

//========================== UPDATE ASSIGNEE VALIDATION ==========================
exports.updateAssigneeValidation = {
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(TICKET_STATUS))
      .required(),
    currentAssignee: Joi.string().hex().length(24).required(),
    newAssignee: Joi.string().hex().length(24).required(),
  }),
};

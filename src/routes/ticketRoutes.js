const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const upload = require("../middleware/uploads");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");

const {
  createTicket,
  getTickets,
  updateTicket,
  deleteTicket,
  getTicketActivity,
  getTicketByUserId,
  updateAssignee,
} = require("../controller/ticketController");

const {
  createTicketValidation,
  getTicketValidation,
  updateTicketValidation,
  deleteTicketValidation,
  getTicketActivityValidation,
  getTicketByUserIdValidation,
  updateAssigneeValidation,
} = require("../validation/ticketValidation");

//========================== CREATE TICKET ==========================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  upload("tickets").array("attachFile", 5),
  validate(createTicketValidation),
  createTicket,
);

//========================== DISPLAY TICKET ==========================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getTicketValidation),
  getTickets,
);

//========================== DISPLAY TICKET ACTIVITY ==========================
router.get(
  "/:ticketId/activity",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getTicketActivityValidation),
  getTicketActivity,
);

//========================== UPDATE ASSIGNEE ==========================
router.put(
  "/update-assignee",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(updateAssigneeValidation),
  updateAssignee,
);

//========================== EDIT TICKET ==========================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  upload("tickets", {
    useUserFolder: true,
    useTimestamp: true,
  }).array("attachFile", 5),
  validate(updateTicketValidation),
  updateTicket,
);

//========================== DELETE TICKET ==========================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(deleteTicketValidation),
  deleteTicket,
);

//========================== GET TICKET BY USER ID ==========================
router.get(
  "/user/:userId",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(getTicketByUserIdValidation),
  getTicketByUserId,
);

module.exports = router;

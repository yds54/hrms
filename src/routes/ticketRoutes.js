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
} = require("../controller/ticketController");

const {
  createTicketValidation,
  getTicketValidation,
  updateTicketValidation,
  deleteTicketValidation,
} = require("../validation/ticketValidation");

//========================== CREATE TICKET ==========================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  //upload.single("file"),
  upload("tickets").array("attachFile", 5),
  validate(createTicketValidation),
  createTicket,
);

//========================== DISPLAY TICKET ==========================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  validate(getTicketValidation),
  getTickets,
);

//========================== EDIT TICKET ==========================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  upload("tickets").array("attachFile", 5),
  validate(updateTicketValidation),
  updateTicket,
);

//========================== DELETE TICKET ==========================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  validate(deleteTicketValidation),
  deleteTicket,
);

module.exports = router;

const express = require("express");
const router = express.Router();

const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const upload = require("../middleware/uploads");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  createComment,
  getComments,
} = require("../controller/ticketCommentController");

const {
  createCommentValidation,
  getCommentValidation,
} = require("../validation/ticketCommentValidation");

//================ CREATE COMMENT =================
router.post(
  "/:ticketId/comment",
  authenticateJWT,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  upload("tickets", {
    useUserFolder: true,
    useTimestamp: true,
  }).array("attachFile", 5),
  validate(createCommentValidation),
  createComment,
);

//================ GET COMMENTS =================
router.get(
  "/:ticketId/comments",
  authenticateJWT,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  validate(getCommentValidation),
  getComments,
);

module.exports = router;

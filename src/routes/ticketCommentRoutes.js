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
  deleteComment,
} = require("../controller/ticketCommentController");

const {
  createCommentValidation,
  getCommentValidation,
  deleteCommentValidation,
} = require("../validation/ticketCommentValidation");

//================ CREATE COMMENT =================
router.post(
  "/:ticketId/comment",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
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
  authorizeRoles(...Object.values(ROLES)),
  validate(getCommentValidation),
  getComments,
);

//================ DELETE COMMENT =================
router.delete(
  "/comment/:commentId",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(deleteCommentValidation),
  deleteComment,
);

module.exports = router;

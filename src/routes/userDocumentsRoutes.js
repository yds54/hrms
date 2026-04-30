const express = require("express");
const router = express.Router();

const {
  addUserDocuments,
  getAllUserDocuments,
  deleteUserDocuments,
  updateUserDocuments,
  getUserDocumentsById,
} = require("../controller/userDocumentsController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const cloudinaryUpload = require("../middleware/cloudinaryUpload");
const createUploader = require("../middleware/uploads");

const {
  addUserDocumentsValidation,
  getUserDocumentsValidation,
  deleteUserDocumentsValidation,
  updateUserDocumentsValidation,
  getUserDocumentsByIdValidation,
} = require("../validation/userDocumentsValidation");

const { validate } = require("express-validation");
const { ROLES } = require("../utils/enum");

const upload = createUploader("userDocuments", {
  useUserFolder: true,
});
const documentUploadFields = [
  { name: "offerLetter", maxCount: 1 },
  { name: "appointmentLetter", maxCount: 1 },
  { name: "tenthMarksheet", maxCount: 1 },
  { name: "twelfthOrDiplomaMarksheet", maxCount: 1 },
  { name: "bachelorsCertificate", maxCount: 1 },
  { name: "mastersDegreeMarksheet", maxCount: 1 },
  { name: "panCard", maxCount: 1 },
  { name: "otherDocuments", maxCount: 10 },
];

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  upload.fields(documentUploadFields),
  cloudinaryUpload({
    folder: "userDocuments",
    useUserFolder: true,
  }),
  validate(addUserDocumentsValidation),
  addUserDocuments,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getUserDocumentsValidation),
  getAllUserDocuments,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER),
  validate(getUserDocumentsByIdValidation),
  getUserDocumentsById,
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  upload.fields(documentUploadFields),
  cloudinaryUpload({
    folder: "userDocuments",
    useUserFolder: true,
  }),
  validate(updateUserDocumentsValidation),
  updateUserDocuments,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteUserDocumentsValidation),
  deleteUserDocuments,
);

module.exports = router;

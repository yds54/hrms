const { Joi } = require("express-validation");

exports.addUserDocumentsValidation = {
  body: Joi.object({
    userId: Joi.string().hex().length(24).required(),

    documentsTakenDate: Joi.date().required(),

    offerLetter: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    appointmentLetter: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    tenthMarksheet: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    twelfthOrDiplomaType: Joi.string()
      .valid("12th", "Diploma")
      .optional()
      .allow(null, ""),

    twelfthOrDiplomaMarksheet: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    bachelorsCertificate: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    mastersDegreeMarksheet: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    panCard: Joi.object({
      panNumber: Joi.string().allow("", null),
      remark: Joi.string().allow("", null),
    }).optional(),

    otherDocuments: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.object({
            documentName: Joi.string().required(),
            remark: Joi.string().allow("", null),
          }),
        ),
        Joi.string(),
      )
      .optional(),

    isDeleted: Joi.boolean().optional(),
  }),
};

exports.updateUserDocumentsValidation = {
  body: Joi.object({
    userId: Joi.string().hex().length(24).optional(),

    documentsTakenDate: Joi.date().optional(),

    offerLetter: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    appointmentLetter: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    tenthMarksheet: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    twelfthOrDiplomaType: Joi.string()
      .valid("12th", "Diploma")
      .optional()
      .allow(null, ""),

    twelfthOrDiplomaMarksheet: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    bachelorsCertificate: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    mastersDegreeMarksheet: Joi.object({
      remark: Joi.string().allow("", null),
    }).optional(),

    panCard: Joi.object({
      panNumber: Joi.string().allow("", null),
      remark: Joi.string().allow("", null),
    }).optional(),

    otherDocuments: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.object({
            documentName: Joi.string().required(),
            remark: Joi.string().allow("", null),
          }),
        ),
        Joi.string(),
      )
      .optional(),

    isDeleted: Joi.boolean().optional(),
  }),
};

exports.getUserDocumentsValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
  }),
};

exports.getUserDocumentsByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteUserDocumentsValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

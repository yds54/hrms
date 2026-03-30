const { Joi } = require('express-validation');

exports.holidaydeleteValidation = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),
};

exports.getholidayValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    month: Joi.number(),
    year: Joi.number(),
    id:Joi.string().hex()
  }),
};

exports.addholidayValidation = {
    body: Joi.object({
        holidayDate:Joi.date().required(),
        holidayReason:Joi.string().required()
    })
}

exports.updateholidayValidation = {
     params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),
  
   body: Joi.object({
        holidayDate:Joi.date().required(),
        holidayReason:Joi.string().required()
    })
}
//holidayDate
//holidayReason
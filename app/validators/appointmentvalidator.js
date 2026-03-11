const joi = require("joi");

const appointmentValidate = joi.object({
  doctorId: joi.string().required(),
  userId: joi.string().required(),
  name:joi.string().required(),
  date: joi.date().required(),
  time: joi.string().required(),
});

module.exports = appointmentValidate;

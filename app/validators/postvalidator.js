const joi = require("joi");

const adminDoctorvalidate = joi.object({
  name: joi.string().required().messages({
    "string.empty": `"name" cannot be empty`,
    "any.required": `"name" is required`,
  }),

  fees: joi.string().required().messages({
    "string.empty": `"fees" cannot be empty`,
    "any.required": `"fees" is required`,
  }),

  departmentId: joi.string().required().messages({
    "string.empty": `"departmentId" cannot be empty`,
    "any.required": `"departmentId" is required`,
  }),

  schedule: joi
    .object({
      startTime: joi.string().required().messages({
        "any.required": `"startTime" is required`,
      }),
      endTime: joi.string().required().messages({
        "any.required": `"endTime" is required`,
      }),
      slotDuration: joi.number().required().messages({
        "any.required": `"slotDuration" is required`,
      }),
    })
    .required(),
});
module.exports = {
  adminDoctorvalidate,
};

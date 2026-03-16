const joi = require("joi");

const availableSlotSchema = joi.object({
  date: joi.date().iso().required(),
  time: joi
    .string()
    // .pattern(/^[0-9]+$/)
    .required(),
});

const adminDoctorvalidate = joi.object({
  name: joi.string().required().messages({
    "string.empty": `"name" cannot be empty`,
    "string.min": '"name" should have at least {#limit} characters',
    "any.required": `"name" is required`,
  }),
 
  fees: joi.string().required().messages({
    "string.empty": `"price" cannot be empty`,
    "string.min": `"price" should have at least {#limit} characters`,
    "any.required": `"price" is required`,
  }),
  availableSlots: joi.array().items(availableSlotSchema).required(),
  departmentId: joi.string().required().messages({
  "string.empty": `"departmentId" cannot be empty`,
  "any.required": `"departmentId" is required`,
}),
});

module.exports = {
  adminDoctorvalidate,
};

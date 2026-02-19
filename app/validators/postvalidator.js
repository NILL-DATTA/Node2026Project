const joi = require("joi");

const availableSlotSchema = joi.object({
    date: joi.date().iso().required(),  
    time: joi.string().length(4).pattern(/^[0-9]+$/).required()  
});

const adminDoctorvalidate= joi.object({
  name: joi.string().min(3).max(15).required().messages({
    "string.empty": `"name" cannot be empty`,
    "string.min": '"name" should have at least {#limit} characters',
    "any.required": `"name" is required`,
  }),
  specialization: joi.string().min(3).required().messages({
    "string.empty": `"category" cannot be empty`,
    "string.min": `"category" should have at least {#limit} characters`,
    "any.required": `"category" is required`,
  }),
  fees: joi.string().min(3).required().messages({
    "string.empty": `"price" cannot be empty`,
    "string.min": `"price" should have at least {#limit} characters`,
    "any.required": `"price" is required`,
  }),
   availableSlots: joi.array().items(availableSlotSchema).required()

});

module.exports = {
  adminDoctorvalidate,
};

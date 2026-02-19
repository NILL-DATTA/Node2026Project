const joi = require("joi");

const regsiterValidate = joi.object({
  first_name: joi.string().min(3).max(10).required().messages({
    "string.empty": "First name cannot be empty",
    "string.min": '"first_name" should have at least {#limit} characters',
    "any.required": "First name is required",
  }),

  last_name: joi.string().min(3).max(10).required().messages({
    "string.empty": "Last name cannot be empty",
    "string.min": '"last_name" should have at least {#limit} characters',
    "any.required": "Last name is required",
  }),

  email: joi.string().min(7).max(50).required().messages({
    "string.empty": "email name cannot be empty",
    "string.min": "email should have at least {#limit} characters",
    "any.required": "Email is required",
  }),

  address: joi.string().min(2).max(10).required().messages({
    "string.empty": "Address name cannot be empty",
    "string.min": "address should have at least {#limit} characters",
    "any.required": "Address is required",
  }),

  password: joi.string().min(6).max(10).required().messages({
    "string.empty": "password  cannot be empty",
    "string.min": "password should have at least {#limit} characters",
    "any.required": "password is required",
  }),

  confirm_password: joi
    .string()
    .min(1)
    .max(10)
    .required()
    .valid(joi.ref("password"))
    .messages({
      "any.only": "Confirm password must match password",
      "string.empty":
        "confirm_password should have at least {#limit} characters",
      "any.required": "confirm_password is required",
    }),
});

const otpValidate = joi.object({
  userId: joi.string().trim().required().messages({
    "string.empty": "user id cannot be empty",
    "any.requried": "user id is required",
  }),
  otp: joi
    .string()
    .length(6)
    .trim()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.empty": "OTP cannot be empty",
      "any.required": "OTP is required",
      "string.length": "OTP length should  be 6 limits",
    }),
});

const loginvalidate = joi.object({
  email: joi.string().min(7).max(50).required().messages({
    "string.empty": "email name cannot be empty",
    "string.min": "email should have at least {#limit} characters",
    "any.required": "Email is required",
  }),

  password: joi.string().min(6).max(50).required().messages({
    "string.empty": "password  cannot be empty",
    "string.min": "password should have at least {#limit} characters",
    "any.required": "password is required",
  }),
});

module.exports = {
  regsiterValidate,
  otpValidate,
  loginvalidate,
};

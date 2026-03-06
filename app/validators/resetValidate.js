const joi = require("joi");

const resetValidate = joi.object({
  password: joi.string().min(6).max(50).required().messages({
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

module.exports = resetValidate;

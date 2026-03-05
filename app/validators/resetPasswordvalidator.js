const joi = require("joi");

const resetValidate = joi.object({
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org"] } })
    .required()
    .messages({
      "string-email": `Email address is invalid`,
      "string-empty": `Email is cannot be empty`,
      "any.required": `Email is required`,
    }),
});

module.exports = resetValidate;

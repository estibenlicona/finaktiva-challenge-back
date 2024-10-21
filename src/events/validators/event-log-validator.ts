import Joi from 'joi';

export const registerEventLogSchema = Joi.object({
  Description: Joi.string().required(),
  Type: Joi.string().required()
});
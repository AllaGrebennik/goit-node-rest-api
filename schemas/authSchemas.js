import Joi from "joi";

export const createUserSchema = Joi.object({
    email: Joi.string()
        .email()
        .required(),
    password: Joi.string()
        .min(4)
        .required(),
});

export const changeSubscriptionSchema = Joi.object({
    subscription: Joi.string().
        valid('starter', 'pro', 'business')
        .required()
});

export const emailUserSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
});
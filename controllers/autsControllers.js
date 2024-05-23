import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { createUserSchema, changeSubscriptionSchema } from "../schemas/authSchemas.js";
import HttpError from "../helpers/HttpError.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res, next) => {
    const { email, password } = req.body;
    const emailInLowerCase = email ? email.toLowerCase(): "";
    try {
        const { error } = createUserSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "Помилка від Joi");
        };

        const user = await User.findOne({ email: emailInLowerCase });
        if (user !== null) {
            throw HttpError(409, "Email in use");
        };

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await User.create({email: emailInLowerCase, password: passwordHash});
        res.status(201).json({
            "user": {
                email: newUser.email,
                subscription: newUser.subscription
            }
        });
    }
    catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;
    const emailInLowerCase = email ? email.toLowerCase(): "";
    try {
        const { error } = createUserSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "Помилка від Joi");
        };

        let user = await User.findOne({ email: emailInLowerCase });
        if (user === null) {
            throw HttpError(401, "Email or password is wrong");
        };

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch === false) {
            throw HttpError(401, "Email or password is wrong");
        };
        
        const payload = {
            id: user._id,
            email: user.email
        }
        
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "10h"});
        user = await User.findByIdAndUpdate(user._id, { token }, {new: true})
        res.status(200).json({
            "token": user.token,
            "user": {
                email: user.email,
                subscription: user.subscription
            }
        });
    }
    catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, { token: null })
        if (user === null) {
            throw HttpError(404);
        }
        res.status(200).end();
    }
    catch (error) {
        next(error);
    }
};

export const currentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
        if (user === null) {
            throw HttpError(401, "Not authorized");
        }
        res.status(200).json({
            email: user.email,
            subscription: user.subscription
        });
    }
    catch (error) {
        next(error);
    }
};

export const updateSubscription = async (req, res, next) => {
    try {
        const { subscription } = req.body;
        const { error } = changeSubscriptionSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "Помилка від Joi");
        };
        
        const user = await User.findByIdAndUpdate(req.user.id, { subscription }, {new: true})
        if (user === null) {
            throw HttpError(401, "Not authorized");
        }
        res.status(200).json({
            email: user.email,
            subscription: user.subscription
        });
    }
    catch (error) {
        next(error);
    }
};
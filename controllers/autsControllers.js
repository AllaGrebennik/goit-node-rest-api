import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as fs from "node:fs/promises";
import path from "node:path";
import gravatar from "gravatar";
import Jimp from "jimp";
import mail from "../helpers/mail.js";
import User from "../models/user.js";
import { createUserSchema, changeSubscriptionSchema, emailUserSchema } from "../schemas/authSchemas.js";
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
        const avatar = gravatar.url(email);
        const verifyToken = crypto.randomUUID(); 

        const newUser = await User.create({
            email: emailInLowerCase,
            password: passwordHash,
            avatarURL: avatar,
            verificationToken: verifyToken,
        });

        mail.sendMail({
            to: emailInLowerCase,
            from: "grebennik.alla@meta.ua",
            subject: "Welcome to ContactBook",
            html: `To confirm your email plese click on the <a href="http://localhost:3000/users/verify/${verifyToken}">link</a>`,
            text: `To confirm your email plese open the link http://localhost:3000/users/verify/${verifyToken}`
            
        });

        res.status(201).json({
            "user": {
                email: newUser.email,
                subscription: newUser.subscription,
                avatarURL: newUser.avatarURL
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

        if (user.verify === false) {
            return res.status(401).send({ message: "Please verify your email" });
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
            "message": "Verification email sent"
        });
    }
    catch (error) {
        next(error);
    }
};


export const getAvatar = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
        if (user === null) {
            throw HttpError(401);
        };

        if (user.avatarURL === null) {
            throw HttpError(404, "Avatar not found");
        }
        res.status(200).sendfile(path.resolve("public", "avatars", user.avatarURL));
    }
    catch (error) {
        next(error);
    }
};

export const uploadAvatar = async (req, res, next) => {
    try {
        if (req.file === undefined)
            throw HttpError(400);
        
        const userAvatar = await Jimp.read(req.file.path);
        await userAvatar.cover(250, 250).writeAsync(req.file.path);

        await fs.rename(req.file.path, path.resolve("public", "avatars", req.file.filename));
        const avatarURL = path.join("avatars", req.file.filename);

        const user = await User.findByIdAndUpdate(req.user.id, { avatarURL }, { new: true });
        if (user === null) {
            throw HttpError(401, "Not authorized");
        }
        res.status(200).json({
            avatarURL: user.avatarURL
        });
    }
    catch (error) {
        next(error);
    }
};
  
export const userVerify = async (req, res, next) => {
    try {
        const { verificationToken } = req.params;
        
        const user = await User.findOne({ verificationToken });
        if (user === null) {
            throw HttpError(404, "User not found");
        };

        await User.findByIdAndUpdate(
            user._id,
            { verify: true, verificationToken: null },
            { new: true });
        
        if (user === null) {
            throw HttpError(404, "User not found");
        }

        res.status(200).json({"message": "Verification successful"});
    }
    catch (error) {
        next(error);
    }
};

export const userResendVerify = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw HttpError(400, "missing required field email");
        }
    
        const { error } = emailUserSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "Помилка від Joi");
        };

        const user = await User.findOne({ email: email.toLowerCase() });
        if (user === null) {
            throw HttpError(404, "User not found");
        };

        if (user.verify === true) {
            throw HttpError(400, "Verification has already been passed");
        };

        const verifyToken = crypto.randomUUID();
        await User.findByIdAndUpdate(user._id, { verificationToken: verifyToken }, { new: true });
        
        mail.sendMail({
            to: email.toLowerCase(),
            from: "grebennik.alla@meta.ua",
            subject: "Welcome to ContactBook",
            html: `To confirm your email plese click on the <a href="http://localhost:3000/users/verify/${verifyToken}">link</a>`,
            text: `To confirm your email plese open the link http://localhost:3000/users/verify/${verifyToken}`
            
        });
        
        res.status(200).json({ "message": "Verification email sent" });
    }
    catch (error) {
        next(error);
    }
};

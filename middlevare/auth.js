import jwt from "jsonwebtoken";
import User from "../models/user.js";
import HttpError from "../helpers/HttpError.js";

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;
    if (typeof authorizationHeader === "undefined") {
        return next(HttpError(401, "Not authorized"));
    };

    const [bearer, token] = authorizationHeader.split(" ", 2);
    if (bearer !== "Bearer") {
        return next(HttpError(401, "Not authorized"));
    };

    jwt.verify(token, JWT_SECRET, async (err, decode) => {
        if (err) {
            return next(HttpError(401, "Not authorized"));
        }
        
        try {
            const user = await User.findById(decode.id);
            if (user === null || user.token !== token) {
                throw HttpError(401, "Not authorized");
            };
            req.user = {
                id: decode.id,
                email: decode.email
            };
            next();
        } catch (error) {
            next(error);
        }
  });
};

export default auth;
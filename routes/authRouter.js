import express from "express";
import {
  register,
  login,
  logout,
  currentUser,
  updateSubscription
} from "../controllers/autsControllers.js";
import authMiddleware from "../middlevare/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/current", authMiddleware, currentUser);
router.post("/", authMiddleware, updateSubscription);

export default router;
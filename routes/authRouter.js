import express from "express";
import {
  register,
  login,
  logout,
  currentUser,
  updateSubscription,
  getAvatar,
  uploadAvatar,
  userVerify,
  userResendVerify
} from "../controllers/autsControllers.js";
import authMiddleware from "../middlevare/auth.js";
import uploadMiddleware from "../middlevare/upload.js";

const router = express.Router();

router.post("/register", register);
router.get("/verify/:verificationToken", userVerify);
router.post("/verify", userResendVerify);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/current", authMiddleware, currentUser);
router.post("/", authMiddleware, updateSubscription);
router.get("/avatars", authMiddleware, getAvatar);
router.patch("/avatars", authMiddleware, uploadMiddleware.single("avatar"), uploadAvatar);

export default router;
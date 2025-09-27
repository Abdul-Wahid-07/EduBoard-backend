import express from "express";
import notifications from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, upload.single("noticeImage"), notifications.createNotification);
router.get("/", authMiddleware, notifications.getNotifications);
router.patch("/mark-all-read", authMiddleware, notifications.markAllRead);
router.patch("/:id", authMiddleware, notifications.toggleRead);

router.post("/save-fcm-token", authMiddleware, notifications.saveFcmToken);

export default router;

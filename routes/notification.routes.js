import express from "express";
import notifications from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, notifications.createNotification);
router.get("/", authMiddleware, notifications.getNotifications);
router.patch("/mark-all-read", authMiddleware, notifications.markAllRead);
router.patch("/:id", authMiddleware, notifications.toggleRead);

export default router;

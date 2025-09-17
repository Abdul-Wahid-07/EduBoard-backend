import express from "express";
import { createNotification, getNotifications } from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createNotification);
router.get("/", authMiddleware, getNotifications);

export default router;

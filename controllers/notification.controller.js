import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// Create Notification (Only Authority)
export const createNotification = async (req, res) => {
  try {
    const { title, message, priority } = req.body;

    const notification = await Notification.create({
      title,
      message,
      priority,
      createdBy: req.user.id,
    });

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get Notifications (Only Students)
export const getNotifications = async (req, res) => {
  try {
    // if (req.user.role !== "student") {
    //   return res.status(403).json({ message: "Only students can view notifications" });
    // }

    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

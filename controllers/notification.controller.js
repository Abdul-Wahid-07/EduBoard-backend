import Notification from "../models/notification.model.js";

// Create Notification (Only Authority)
const createNotification = async (req, res) => {
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
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean(); // return plain objects, faster

    const formatted = notifications.map((n) => ({
      ...n,
      isRead: n.readBy.some((id) => id.toString() === userId.toString()),
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Mark all as read
const markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const toggleRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;
    const userId = req.user.id;

    if (isRead) {
      // If marking as read, add userId if not already present
      await Notification.findByIdAndUpdate(id, {
        $addToSet: { readBy: userId },
      });
    } else {
      // If marking as unread, remove userId
      await Notification.findByIdAndUpdate(id, {
        $pull: { readBy: userId },
      });
    }

    res.status(200).json({ success: true, message: "Notification updated" });
  } catch (err) {
    console.error("Error toggling read state:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export default {createNotification, getNotifications, markAllRead, toggleRead};

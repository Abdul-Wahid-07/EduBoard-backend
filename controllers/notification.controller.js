import Notification from "../models/notification.model.js";
import User from "../models/user.model.js"; // Import User model
import admin from "../firebaseAdmin.js"; // Firebase Admin SDK

// Create Notification (Only Authority)
// Create Notification (Only Authority)
const createNotification = async (req, res) => {
  try {
    const { title, message, priority } = req.body;

    const notification = await Notification.create({
      title,
      message,
      priority,
      createdBy: req.user.id,
      noticeImage: req.file ? `/uploads/notices/${req.file.filename}` : null,
    });

    // Get all users with valid FCM tokens
    const users = await User.find({ fcmToken: { $ne: null } }, "fcmToken");
    const tokens = users.map((u) => u.fcmToken);

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
      };

      // Send to multiple tokens
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...payload,
      });

      // Handle invalid tokens
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(tokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        // Remove invalid tokens from DB
        await User.updateMany(
          { fcmToken: { $in: invalidTokens } },
          { $unset: { fcmToken: 1 } }
        );
        console.log(`Removed ${invalidTokens.length} invalid tokens`);
      }
    }

    res.status(201).json(notification);
  } catch (err) {
    console.error("Error creating notification:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Get Notifications (Only Students)
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();

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
      await Notification.findByIdAndUpdate(id, {
        $addToSet: { readBy: userId },
      });
    } else {
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

// Save FCM Token
const saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id; // From JWT middleware

    if (!token) {
      return res.status(400).json({ success: false, message: "Token required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    await User.findByIdAndUpdate(userId, { fcmToken: token }, { new: true });

    res.json({ success: true, message: "Token saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  createNotification,
  getNotifications,
  markAllRead,
  toggleRead,
  saveFcmToken,
};

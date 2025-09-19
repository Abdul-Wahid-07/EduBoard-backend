import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import sendEmail from "../services/email.services.js";

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, role, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, role, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, portal } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Optional: check portal access
    if (portal && portal !== user.role) {
      return res.status(403).json({ message: "Access denied for this portal" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user._doc; // remove password field

    res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const contact = async (req, res) => {
  const { firstName, lastName, email, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Send email
    await sendEmail(
      email, // recipient
      "Contact Form Submission", // subject
      `We have successfully received your message: ${message}`, // plain text
      `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color:#4F46E5;">New Contact Form Submission</h2>
          <p><strong>Dear ${firstName} ${lastName},</strong></p>
          <p>Thank you for contacting <b>EduBoard</b>. We have successfully received your message.</p>
          
          <h3>Your Details</h3>
          <p><b>Name:</b> ${firstName} ${lastName}</p>
          <p><b>Email:</b> ${email}</p>
          
          <h3>Your Message</h3>
          <p style="background:#f9f9f9; padding:10px; border-left:3px solid #4F46E5;">
            ${message}
          </p>

          <br/>
          <p>Our support team will get back to you shortly.</p>
          <p style="color:#4F46E5; font-weight:bold;">– EduBoard Team</p>
        </div>
      `
    );

    res.status(200).json({ success: "Message sent successfully!" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};


export default { register, login, contact };

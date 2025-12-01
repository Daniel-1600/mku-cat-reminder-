import express from "express";
import jwt from "jsonwebtoken";
import transporter from "../config/email.js";
import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const router = express.Router();

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send verification code email
const sendVerificationEmail = async (email, code, fullName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "CAT Reminder - Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">CAT Reminder Verification</h2>
        <p>Hello ${fullName},</p>
        <p>Your verification code is:</p>
        <h1 style="background-color: #EFF6FF; padding: 20px; text-align: center; color: #3B82F6; letter-spacing: 8px;">
          ${code}
        </h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Register route - requires full name, adm number, and MKU email
router.post("/register", async (req, res) => {
  const { email, fullName, admNumber } = req.body;

  try {
    // Validate MKU email
    if (!email.endsWith("@mylife.mku.ac.ke")) {
      return res.status(400).json({
        message: "Please use your MKU email address (@mylife.mku.ac.ke)",
      });
    }

    // Validate required fields
    if (!fullName || !admNumber) {
      return res.status(400).json({
        message: "Full name and admission number are required",
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR adm_number = $2",
      [email, admNumber]
    );

    if (existingUser.rows.length > 0) {
      if (existingUser.rows[0].email === email) {
        return res.status(400).json({ message: "Email already registered" });
      }
      return res
        .status(400)
        .json({ message: "Admission number already registered" });
    }

    // Create new user
    const userId = uuidv4();
    await pool.query(
      "INSERT INTO users (id, email, full_name, adm_number) VALUES ($1, $2, $3, $4)",
      [userId, email, fullName, admNumber]
    );

    // Generate and send verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
      [userId, verificationCode, expiresAt]
    );

    await sendVerificationEmail(email, verificationCode, fullName);

    res.status(201).json({
      message:
        "Registration successful! Check your email for the verification code.",
      userId,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login route - only requires email (MKU email)
router.post("/login", async (req, res) => {
  const { email } = req.body;

  try {
    // Validate MKU email
    if (!email.endsWith("@mylife.mku.ac.ke")) {
      return res.status(400).json({
        message: "Please use your MKU email address (@mylife.mku.ac.ke)",
      });
    }

    // Check if user exists
    const users = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (users.rows.length === 0) {
      return res.status(404).json({
        message: "No account found with this email. Please register first.",
      });
    }

    const user = users.rows[0];

    // Generate and send verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
      [user.id, verificationCode, expiresAt]
    );

    await sendVerificationEmail(email, verificationCode, user.full_name);

    res.status(200).json({
      message: "Verification code sent to your email!",
      userId: user.id,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Verify code route
router.post("/verify-code", async (req, res) => {
  const { userId, code } = req.body;

  try {
    if (!userId || !code) {
      return res.status(400).json({ message: "User ID and code are required" });
    }

    // Find valid verification code
    const codes = await pool.query(
      `SELECT * FROM verification_codes 
       WHERE user_id = $1 AND code = $2 AND is_used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code]
    );

    if (codes.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired verification code",
      });
    }

    // Mark code as used
    await pool.query(
      "UPDATE verification_codes SET is_used = true WHERE id = $1",
      [codes.rows[0].id]
    );

    // Mark email as verified
    await pool.query("UPDATE users SET email_verified = true WHERE id = $1", [
      userId,
    ]);

    // Get user data
    const users = await pool.query(
      "SELECT id, email, full_name, adm_number, email_verified FROM users WHERE id = $1",
      [userId]
    );

    const user = users.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Verification successful!",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        admNumber: user.adm_number,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Resend verification code
router.post("/resend-code", async (req, res) => {
  const { userId } = req.body;

  try {
    // Get user
    const users = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (users.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users.rows[0];

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
      [user.id, verificationCode, expiresAt]
    );

    await sendVerificationEmail(user.email, verificationCode, user.full_name);

    res.status(200).json({ message: "New verification code sent!" });
  } catch (error) {
    console.error("Error resending code:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

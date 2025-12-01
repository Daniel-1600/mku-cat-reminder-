import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import { encrypt, decrypt } from "../utils/encryption.js";

const router = express.Router();

// Connect portal credentials
router.post("/connect", authenticateToken, async (req, res) => {
  const { portalUsername, portalPassword } = req.body;
  const userId = req.user.userId;

  try {
    if (!portalUsername || !portalPassword) {
      return res.status(400).json({
        message: "Portal username and password are required",
      });
    }

    // Encrypt the portal password for secure storage (two-way encryption)
    const encryptedPassword = encrypt(portalPassword);

    // Update user with portal credentials
    await pool.query(
      `UPDATE users 
       SET portal_username = $1, 
           portal_password = $2, 
           portal_connected = true,
           portal_connected_at = NOW()
       WHERE id = $3`,
      [portalUsername, encryptedPassword, userId]
    );

    res.status(200).json({
      message: "Portal credentials connected successfully!",
      portalConnected: true,
    });
  } catch (error) {
    console.error("Error connecting portal:", error);
    console.log(res.status);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get portal connection status
router.get("/status", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT portal_connected, portal_username, portal_connected_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    res.status(200).json({
      portalConnected: user.portal_connected || false,
      portalUsername: user.portal_username || null,
      connectedAt: user.portal_connected_at || null,
    });
  } catch (error) {
    console.error("Error getting portal status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Disconnect portal credentials
router.delete("/disconnect", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    await pool.query(
      `UPDATE users 
       SET portal_username = NULL, 
           portal_password = NULL, 
           portal_connected = false,
           portal_connected_at = NULL
       WHERE id = $1`,
      [userId]
    );

    res.status(200).json({
      message: "Portal credentials disconnected successfully",
      portalConnected: false,
    });
  } catch (error) {
    console.error("Error disconnecting portal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get portal credentials (for scraping - internal use only)
router.get("/credentials/:userId", async (req, res) => {
  const { userId } = req.params;
  const { internalKey } = req.headers;

  // Verify internal API key for security
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      `SELECT portal_username, portal_password 
       FROM users WHERE id = $1 AND portal_connected = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Portal not connected" });
    }

    res.status(200).json({
      portalUsername: result.rows[0].portal_username,
      portalPassword: decrypt(result.rows[0].portal_password), // Decrypt for scraping
    });
  } catch (error) {
    console.error("Error getting credentials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

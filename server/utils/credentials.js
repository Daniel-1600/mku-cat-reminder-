import pool from "../config/db.js";
import { decrypt } from "./encryption.js";

/**
 * Get decrypted portal credentials for a user
 */
export async function getPortalCredentials(userId) {
  try {
    const result = await pool.query(
      `SELECT portal_username, portal_password, portal_connected 
       FROM users WHERE id = $1 AND portal_connected = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Portal not connected for this user");
    }

    const user = result.rows[0];

    return {
      username: user.portal_username,
      password: decrypt(user.portal_password), // Decrypt the password
      connected: user.portal_connected,
    };
  } catch (error) {
    console.error("Error fetching portal credentials:", error);
    throw error;
  }
}

export async function getAllConnectedUsers() {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, portal_username 
       FROM users WHERE portal_connected = true`
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching connected users:", error);
    throw error;
  }
}

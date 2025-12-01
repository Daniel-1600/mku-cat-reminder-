/**
 * CATs API Routes
 * Endpoints to fetch and manage CAT schedules
 */

import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import { scrapeCATsForUser } from "../services/scraper.js";

const router = express.Router();

/**
 * GET /api/cats
 * Get all CATs for the authenticated user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        id, 
        subject_code, 
        subject_name, 
        cat_date, 
        cat_time, 
        venue, 
        duration, 
        cat_number,
        created_at,
        updated_at
       FROM cats 
       WHERE user_id = $1 
       ORDER BY cat_date ASC, cat_time ASC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      cats: result.rows,
    });
  } catch (error) {
    console.error("Error fetching CATs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch CAT schedules",
    });
  }
});

/**
 * GET /api/cats/upcoming
 * Get upcoming CATs (today and future)
 */
router.get("/upcoming", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        id, 
        subject_code, 
        subject_name, 
        cat_date, 
        cat_time, 
        venue, 
        duration, 
        cat_number,
        created_at,
        updated_at
       FROM cats 
       WHERE user_id = $1 
         AND cat_date >= CURRENT_DATE
       ORDER BY cat_date ASC, cat_time ASC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      cats: result.rows,
    });
  } catch (error) {
    console.error("Error fetching upcoming CATs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming CATs",
    });
  }
});

/**
 * POST /api/cats/sync
 * Manually trigger CAT scraping for the authenticated user
 */
router.post("/sync", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if portal is connected
    const userResult = await pool.query(
      "SELECT portal_connected FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].portal_connected) {
      return res.status(400).json({
        success: false,
        message:
          "Portal credentials not connected. Please connect your portal first.",
      });
    }

    // Trigger scraping
    const cats = await scrapeCATsForUser(userId);

    res.json({
      success: true,
      message: `Successfully synced ${cats.length} CAT(s)`,
      count: cats.length,
      cats: cats,
    });
  } catch (error) {
    console.error("Error syncing CATs:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sync CAT schedules",
    });
  }
});

/**
 * GET /api/cats/stats
 * Get statistics about CATs
 */
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Total CATs
    const totalResult = await pool.query(
      "SELECT COUNT(*) as total FROM cats WHERE user_id = $1",
      [userId]
    );

    // Upcoming CATs
    const upcomingResult = await pool.query(
      "SELECT COUNT(*) as upcoming FROM cats WHERE user_id = $1 AND cat_date >= CURRENT_DATE",
      [userId]
    );

    // Past CATs
    const pastResult = await pool.query(
      "SELECT COUNT(*) as past FROM cats WHERE user_id = $1 AND cat_date < CURRENT_DATE",
      [userId]
    );

    // Next CAT
    const nextResult = await pool.query(
      `SELECT subject_name, cat_date, cat_time 
       FROM cats 
       WHERE user_id = $1 AND cat_date >= CURRENT_DATE 
       ORDER BY cat_date ASC, cat_time ASC 
       LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      stats: {
        total: parseInt(totalResult.rows[0].total),
        upcoming: parseInt(upcomingResult.rows[0].upcoming),
        past: parseInt(pastResult.rows[0].past),
        nextCAT: nextResult.rows.length > 0 ? nextResult.rows[0] : null,
      },
    });
  } catch (error) {
    console.error("Error fetching CAT stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch CAT statistics",
    });
  }
});

/**
 * DELETE /api/cats/:id
 * Delete a specific CAT (optional feature)
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const catId = req.params.id;

    const result = await pool.query(
      "DELETE FROM cats WHERE id = $1 AND user_id = $2 RETURNING *",
      [catId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "CAT not found",
      });
    }

    res.json({
      success: true,
      message: "CAT deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting CAT:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete CAT",
    });
  }
});

export default router;

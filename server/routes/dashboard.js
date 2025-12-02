import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Dashboard data endpoint
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Get user data from database
    const users = await pool.query(
      "SELECT id, email, full_name, adm_number, total_courses, completion_rate FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (users.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users.rows[0];

    // Get total courses count from courses table (as backup if user column not updated)
    let totalCourses = user.total_courses || 0;
    let completionRate = user.completion_rate || 0;

    try {
      const coursesResult = await pool.query(
        "SELECT COUNT(*) as total, COALESCE(AVG(progress), 0) as avg_progress FROM courses WHERE user_id = $1",
        [req.user.userId]
      );
      if (coursesResult.rows[0]?.total > 0) {
        totalCourses = parseInt(coursesResult.rows[0].total);
        completionRate = Math.round(
          parseFloat(coursesResult.rows[0].avg_progress)
        );
      }
    } catch (e) {
      // Courses table might not exist yet
      console.log("Courses table not ready:", e.message);
    }

    // Get upcoming deadlines (CATs within 7 days)
    const upcomingResult = await pool.query(
      `SELECT COUNT(*) as upcoming FROM cats 
       WHERE user_id = $1 AND cat_date >= CURRENT_DATE AND cat_date < CURRENT_DATE + INTERVAL '7 days'`,
      [req.user.userId]
    );

    // Get total CATs count
    const catsResult = await pool.query(
      "SELECT COUNT(*) as total FROM cats WHERE user_id = $1",
      [req.user.userId]
    );

    // Get overdue CATs
    const overdueResult = await pool.query(
      `SELECT COUNT(*) as overdue FROM cats 
       WHERE user_id = $1 AND cat_date < CURRENT_DATE`,
      [req.user.userId]
    );

    res.json({
      user: {
        name: user.full_name,
        email: user.email,
        admNumber: user.adm_number,
        plan: "Student Plan",
      },
      stats: {
        totalCourses: totalCourses,
        totalCATs: parseInt(catsResult.rows[0]?.total || 0),
        upcomingDeadlines: parseInt(upcomingResult.rows[0]?.upcoming || 0),
        overdue: parseInt(overdueResult.rows[0]?.overdue || 0),
        completionRate: `${completionRate}%`,
        studyHours: "0hrs",
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

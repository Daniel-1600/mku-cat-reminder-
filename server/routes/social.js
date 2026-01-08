import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ============================================
// GET COURSE MATES - Users taking the same courses
// ============================================
router.get("/coursemates", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.query;

    let query;
    let params;

    if (courseId) {
      // Get users taking a specific course
      query = `
        SELECT DISTINCT 
          u.id,
          COALESCE(u.display_name, u.full_name) as name,
          u.adm_number,
          u.bio,
          u.last_active,
          c.course_name,
          c.course_id,
          (SELECT COUNT(*) FROM courses WHERE user_id = u.id) as total_courses
        FROM users u
        INNER JOIN courses c ON u.id = c.user_id
        WHERE c.course_id = $1
          AND u.id != $2
          AND u.is_discoverable = true
          AND u.show_courses = true
        ORDER BY u.last_active DESC
        LIMIT 50
      `;
      params = [courseId, userId];
    } else {
      // Get all users sharing any course with current user
      query = `
        SELECT DISTINCT 
          u.id,
          COALESCE(u.display_name, u.full_name) as name,
          u.adm_number,
          u.bio,
          u.last_active,
          array_agg(DISTINCT c2.course_name) as shared_courses,
          array_agg(DISTINCT c2.course_id) as shared_course_ids,
          (SELECT COUNT(*) FROM courses WHERE user_id = u.id) as total_courses
        FROM users u
        INNER JOIN courses c2 ON u.id = c2.user_id
        WHERE c2.course_id IN (
          SELECT course_id FROM courses WHERE user_id = $1
        )
        AND u.id != $1
        AND u.is_discoverable = true
        AND u.show_courses = true
        GROUP BY u.id, u.display_name, u.full_name, u.adm_number, u.bio, u.last_active
        ORDER BY u.last_active DESC
        LIMIT 50
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      coursemates: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching course mates:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch course mates" });
  }
});

// ============================================
// GET USER'S COURSES - For filtering course mates
// ============================================
router.get("/my-courses", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT course_id, course_name, 
        (SELECT COUNT(*) FROM courses c2 
         WHERE c2.course_id = courses.course_id 
         AND c2.user_id != $1
         AND EXISTS (SELECT 1 FROM users u WHERE u.id = c2.user_id AND u.is_discoverable = true)
        ) as classmate_count
       FROM courses 
       WHERE user_id = $1
       ORDER BY course_name`,
      [userId]
    );

    res.json({
      success: true,
      courses: result.rows,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, error: "Failed to fetch courses" });
  }
});

// ============================================
// GET USER PROFILE - View another user's profile
// ============================================
router.get("/profile/:userId", authenticateToken, async (req, res) => {
  try {
    const viewingUserId = req.user.userId;
    const targetUserId = req.params.userId;

    const userResult = await pool.query(
      `SELECT 
        u.id,
        COALESCE(u.display_name, u.full_name) as name,
        u.adm_number,
        u.bio,
        u.last_active,
        u.is_discoverable,
        u.show_courses
       FROM users u
       WHERE u.id = $1`,
      [targetUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = userResult.rows[0];

    // Check if user allows discovery
    if (!user.is_discoverable && targetUserId !== viewingUserId) {
      return res
        .status(403)
        .json({ success: false, error: "User profile is private" });
    }

    // Get shared courses if allowed
    let sharedCourses = [];
    if (user.show_courses || targetUserId === viewingUserId) {
      const coursesResult = await pool.query(
        `SELECT c1.course_id, c1.course_name
         FROM courses c1
         WHERE c1.user_id = $1
         AND c1.course_id IN (SELECT course_id FROM courses WHERE user_id = $2)`,
        [targetUserId, viewingUserId]
      );
      sharedCourses = coursesResult.rows;
    }

    res.json({
      success: true,
      profile: {
        ...user,
        sharedCourses,
        isOwnProfile: targetUserId === viewingUserId,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
});

// ============================================
// UPDATE MY PROFILE - Update discovery settings
// ============================================
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { displayName, bio, isDiscoverable, showCourses } = req.body;

    await pool.query(
      `UPDATE users SET 
        display_name = COALESCE($1, display_name),
        bio = COALESCE($2, bio),
        is_discoverable = COALESCE($3, is_discoverable),
        show_courses = COALESCE($4, show_courses),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [displayName, bio, isDiscoverable, showCourses, userId]
    );

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

// ============================================
// GET CONVERSATIONS - List all message threads
// ============================================
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        c.id,
        c.last_message_at,
        c.last_message_preview,
        CASE WHEN c.user1_id = $1 THEN c.user1_unread_count ELSE c.user2_unread_count END as unread_count,
        CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END as other_user_id,
        COALESCE(u.display_name, u.full_name) as other_user_name,
        u.adm_number as other_user_adm
       FROM conversations c
       INNER JOIN users u ON u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY c.last_message_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      conversations: result.rows,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch conversations" });
  }
});

// ============================================
// GET MESSAGES - Get messages in a conversation
// ============================================
router.get("/messages/:otherUserId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const otherUserId = req.params.otherUserId;
    const { limit = 50, before } = req.query;

    let query = `
      SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.is_read,
        m.created_at,
        m.sender_id = $1 as is_mine
      FROM messages m
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
    `;

    const params = [userId, otherUserId];

    if (before) {
      query += ` AND m.created_at < $3`;
      params.push(before);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET is_read = true 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [otherUserId, userId]
    );

    // Update unread count in conversation
    const user1 = userId < otherUserId ? userId : otherUserId;
    const user2 = userId < otherUserId ? otherUserId : userId;
    const unreadColumn =
      userId === user1 ? "user1_unread_count" : "user2_unread_count";

    await pool.query(
      `UPDATE conversations SET ${unreadColumn} = 0 
       WHERE user1_id = $1 AND user2_id = $2`,
      [user1, user2]
    );

    // Get other user info
    const userResult = await pool.query(
      `SELECT id, COALESCE(display_name, full_name) as name, adm_number
       FROM users WHERE id = $1`,
      [otherUserId]
    );

    res.json({
      success: true,
      messages: result.rows.reverse(), // Return in chronological order
      otherUser: userResult.rows[0] || null,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

// ============================================
// SEND MESSAGE - Send a message to another user
// ============================================
router.post("/messages", authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, content } = req.body;

    if (!receiverId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Receiver ID and message content are required",
      });
    }

    // Check if receiver exists and is discoverable
    const receiverResult = await pool.query(
      `SELECT id, is_discoverable FROM users WHERE id = $1`,
      [receiverId]
    );

    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Insert the message
    const messageResult = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, receiver_id, content, is_read, created_at`,
      [senderId, receiverId, content.trim()]
    );

    // Update or create conversation
    const user1 = senderId < receiverId ? senderId : receiverId;
    const user2 = senderId < receiverId ? receiverId : senderId;
    const unreadColumn =
      senderId === user1 ? "user2_unread_count" : "user1_unread_count";

    await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, last_message_at, last_message_preview, ${unreadColumn})
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 1)
       ON CONFLICT (user1_id, user2_id) 
       DO UPDATE SET 
         last_message_at = CURRENT_TIMESTAMP,
         last_message_preview = $3,
         ${unreadColumn} = conversations.${unreadColumn} + 1`,
      [user1, user2, content.trim().substring(0, 100)]
    );

    // Update sender's last active
    await pool.query(
      `UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1`,
      [senderId]
    );

    res.json({
      success: true,
      message: {
        ...messageResult.rows[0],
        is_mine: true,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

// ============================================
// GET UNREAD COUNT - Total unread messages
// ============================================
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM messages
       WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      unreadCount: parseInt(result.rows[0].unread_count) || 0,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch unread count" });
  }
});

export default router;

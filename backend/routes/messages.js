// backend/routes/messages.js
const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
const { Message, User } = require("../models");
const { protect } = require("../middleware/auth");

router.use(protect);

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/messages/unread-count
// Returns unread message count for the current user
// Used by Sidebar badge and AppContext
// MUST be defined BEFORE /:id routes to prevent "unread-count" being treated as an ID
// ════════════════════════════════════════════════════════════════════════════════
router.get("/unread-count", async (req, res) => {
  try {
    const { userId } = req.user;

    const count = await Message.countDocuments({
      school:            req.school._id,
      to:                userId,
      isReadByRecipient: false,
      deletedByRecipient: false,
    });

    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch unread count." });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/messages/contacts
// Returns list of users this user can message within the same school
// Role rules:
//   Parent  → can message teachers + admin only
//   Teacher → can message parents + admin + other teachers
//   Admin   → can message anyone
// ════════════════════════════════════════════════════════════════════════════════
router.get("/contacts", async (req, res) => {
  try {
    const { role, userId, schoolId } = req.user;

    let roleFilter;
    if (role === "parent") {
      // Parents can only initiate contact with teachers and admin
      roleFilter = { $in: ["teacher", "admin"] };
    } else if (role === "teacher") {
      roleFilter = { $in: ["parent", "admin", "teacher"] };
    } else {
      // Admin can message anyone
      roleFilter = { $in: ["admin", "teacher", "parent"] };
    }

    const contacts = await User.find({
      school:     schoolId,
      role:       roleFilter,
      isDisabled: false,
      _id:        { $ne: userId }, // exclude self
    })
      .select("name role avatar class childName")
      .sort({ role: 1, name: 1 })
      .lean();

    // Group by role for the compose UI
    const grouped = contacts.reduce((acc, u) => {
      const key = u.role;
      acc[key] = acc[key] || [];
      acc[key].push(u);
      return acc;
    }, {});

    res.json({ success: true, contacts, grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch contacts." });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/messages — Inbox: top-level messages (not replies)
// Returns conversations the user is part of (sent or received)
// ════════════════════════════════════════════════════════════════════════════════
router.get("/", async (req, res) => {
  try {
    const { userId } = req.user;

    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    // FIXED: use userId (string from JWT), not req.user._id
    // FIXED: use parentMsg field name (matches model schema)
    // FIXED: exclude soft-deleted messages for this user
    const baseFilter = {
      school:   req.school._id,
      parentMsg: null,           // top-level messages only (null, not {$exists:false})
      $or: [
        { from: userId, deletedBySender:    false },
        { to:   userId, deletedByRecipient: false },
      ],
    };

    const [messages, total] = await Promise.all([
      Message.find(baseFilter)
        .populate("from", "name role avatar")
        .populate("to",   "name role avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(baseFilter),
    ]);

    // Annotate each message with reply count and last reply time
    const messageIds = messages.map(m => m._id);
    const replyCounts = await Message.aggregate([
      { $match: { school: req.school._id, parentMsg: { $in: messageIds } } },
      { $group: { _id: "$parentMsg", count: { $sum: 1 }, lastAt: { $max: "$createdAt" } } },
    ]);

    const replyMap = {};
    replyCounts.forEach(r => {
      replyMap[r._id.toString()] = { count: r.count, lastAt: r.lastAt };
    });

    const annotated = messages.map(m => ({
      ...m,
      replyCount: replyMap[m._id.toString()]?.count || 0,
      lastReplyAt: replyMap[m._id.toString()]?.lastAt || null,
    }));

    res.json({
      success:    true,
      messages:   annotated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/messages/:id/thread
// Returns the root message + all replies in chronological order
// Only accessible to the sender and recipient of the root message
// ════════════════════════════════════════════════════════════════════════════════
router.get("/:id/thread", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid message ID." });
    }

    const { userId } = req.user;
    const messageId = req.params.id;

    // Fetch root message first to verify access
    const root = await Message.findOne({
      _id:      messageId,
      school:   req.school._id,
      parentMsg: null, // must be a root message
    }).lean();

    if (!root) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    // FIXED: verify requesting user is part of this conversation
    const isParticipant =
      root.from.toString() === userId.toString() ||
      root.to.toString()   === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation.",
      });
    }

    // Fetch all messages in thread (root + replies)
    // FIXED: use parentMsg field name (matches model schema)
    const thread = await Message.find({
      school: req.school._id,
      $or: [
        { _id:       messageId },
        { parentMsg: messageId },
      ],
    })
      .populate("from", "name role avatar")
      .populate("to",   "name role avatar")
      .sort({ createdAt: 1 }) // chronological order
      .lean();

    // Auto-mark all unread messages in this thread as read
    await Message.updateMany(
      {
        school:            req.school._id,
        $or: [{ _id: messageId }, { parentMsg: messageId }],
        to:                userId,
        isReadByRecipient: false,
      },
      { $set: { isReadByRecipient: true } }
    );

    res.json({ success: true, thread, count: thread.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch conversation." });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/messages — Send a new message or reply
// ════════════════════════════════════════════════════════════════════════════════
router.post("/", async (req, res) => {
  try {
    const { userId, role, schoolId } = req.user;
    const { to, subject, body, parentMsg } = req.body;

    // Validate required fields
    if (!to || !isValidId(to)) {
      return res.status(400).json({ success: false, message: "Valid recipient ID is required." });
    }
    if (!body?.trim()) {
      return res.status(400).json({ success: false, message: "Message body is required." });
    }
    if (to === userId) {
      return res.status(400).json({ success: false, message: "You cannot message yourself." });
    }

    // FIXED: verify recipient exists and belongs to this school
    const recipient = await User.findOne({
      _id:        to,
      school:     schoolId,
      isDisabled: false,
    }).select("_id name role").lean();

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found in this school.",
      });
    }

    // Role-based messaging restrictions
    // Parents can only message teachers and admins (not other parents)
    if (role === "parent" && recipient.role === "parent") {
      return res.status(403).json({
        success: false,
        message: "Parents can only message teachers and school administrators.",
      });
    }

    // If this is a reply, validate the parent message
    let validatedParentMsg = null;
    if (parentMsg) {
      if (!isValidId(parentMsg)) {
        return res.status(400).json({ success: false, message: "Invalid parent message ID." });
      }

      const parentMessage = await Message.findOne({
        _id:    parentMsg,
        school: req.school._id,
      }).lean();

      if (!parentMessage) {
        return res.status(404).json({
          success: false,
          message: "Parent message not found.",
        });
      }

      // Verify user is part of the original conversation
      const isParticipant =
        parentMessage.from.toString() === userId.toString() ||
        parentMessage.to.toString()   === userId.toString();

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: "You cannot reply to a conversation you are not part of.",
        });
      }

      validatedParentMsg = parentMsg;
    }

    // FIXED: Only set safe, whitelisted fields — no req.body spread
    const message = await Message.create({
      school:            req.school._id,
      from:              userId,          // FIXED: userId from JWT
      to,
      subject:           subject?.trim()?.slice(0, 200) || "",
      body:              body.trim().slice(0, 5000),   // cap message length
      parentMsg:         validatedParentMsg,
      isReadByRecipient: false,
      deletedBySender:   false,
      deletedByRecipient: false,
    });

    await message.populate([
      { path: "from", select: "name role avatar" },
      { path: "to",   select: "name role avatar" },
    ]);

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// PUT /api/messages/:id/read — Mark a message as read
// Only the recipient can mark as read
// ════════════════════════════════════════════════════════════════════════════════
router.put("/:id/read", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid message ID." });
    }

    const { userId } = req.user;

    // FIXED: use isReadByRecipient (matches model schema)
    // FIXED: use userId not req.user._id
    const message = await Message.findOneAndUpdate(
      {
        _id:    req.params.id,
        school: req.school._id,
        to:     userId,
      },
      { $set: { isReadByRecipient: true } },
      { new: true }
    ).lean();

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you are not the recipient.",
      });
    }

    res.json({ success: true, message: "Message marked as read." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark message as read." });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// PUT /api/messages/read-all — Mark all unread messages as read
// ════════════════════════════════════════════════════════════════════════════════
router.put("/read-all", async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await Message.updateMany(
      {
        school:            req.school._id,
        to:                userId,
        isReadByRecipient: false,
      },
      { $set: { isReadByRecipient: true } }
    );

    res.json({
      success:  true,
      message:  `${result.modifiedCount} message(s) marked as read.`,
      modified: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark messages as read." });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// DELETE /api/messages/:id — Soft delete a message
// Sender can delete from their sent view
// Recipient can delete from their inbox
// Message is only truly gone when both sides have deleted it
// ════════════════════════════════════════════════════════════════════════════════
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid message ID." });
    }

    const { userId } = req.user;

    const existing = await Message.findOne({
      _id:    req.params.id,
      school: req.school._id,
      $or: [{ from: userId }, { to: userId }],
    }).lean();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you are not part of this conversation.",
      });
    }

    const isSender    = existing.from.toString() === userId.toString();
    const isRecipient = existing.to.toString()   === userId.toString();

    const update = {};
    if (isSender)    update.deletedBySender    = true;
    if (isRecipient) update.deletedByRecipient = true;

    // Hard delete only when both sides have deleted
    const updatedMsg = await Message.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true }
    ).lean();

    if (updatedMsg.deletedBySender && updatedMsg.deletedByRecipient) {
      await Message.findByIdAndDelete(req.params.id);
    }

    res.json({ success: true, message: "Message deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete message." });
  }
});

module.exports = router;
import express from "express";
import AuditTrail from "../models/auditTrailModel.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Log an audit action
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { action, performedBy, affectedUser, details } = req.body;
    await AuditTrail.create({
      action,
      performedBy,
      affectedUser,
      newData: details || {},
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

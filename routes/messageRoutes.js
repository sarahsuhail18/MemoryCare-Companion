const express = require("express");
const {
  getPatientConversation,
  patientSendMessage,
  getCaregiverInbox,
  getCaregiverConversation,
  caregiverSendMessage,
  getUnreadCount
} = require("../controllers/messageController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Shared — unread count badge
router.get("/unread-count", protect, getUnreadCount);

// Patient routes
router.get("/patient/conversation", protect, authorize("user"), getPatientConversation);
router.post("/patient/send", protect, authorize("user"), patientSendMessage);

// Caregiver routes
router.get("/caregiver/inbox", protect, authorize("caregiver"), getCaregiverInbox);
router.get("/caregiver/conversation/:patientId", protect, authorize("caregiver"), getCaregiverConversation);
router.post("/caregiver/send", protect, authorize("caregiver"), caregiverSendMessage);

module.exports = router;
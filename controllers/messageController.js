const Message = require("../models/Message");
const User = require("../models/User");

// ─── Patient: get conversation with their caregiver ──────────────────────────
// GET /api/messages/patient/conversation
exports.getPatientConversation = async (req, res) => {
  try {
    const patientId = req.session.user.id;

    // Find the patient's assigned caregivers
    const patient = await User.findById(patientId).select("assignedCaregivers");
    if (!patient || !patient.assignedCaregivers.length) {
      return res.status(200).json({ success: true, messages: [], caregiverId: null, caregiverName: "No caregiver assigned" });
    }

    // Use the first assigned caregiver
    const caregiverId = patient.assignedCaregivers[0];
    const caregiver = await User.findById(caregiverId).select("fullName");

    const messages = await Message.find({
      $or: [
        { senderId: patientId, receiverId: caregiverId },
        { senderId: caregiverId, receiverId: patientId }
      ]
    }).sort({ createdAt: 1 });

    // Mark all caregiver messages as read
    await Message.updateMany(
      { senderId: caregiverId, receiverId: patientId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      messages,
      caregiverId,
      caregiverName: caregiver?.fullName || "Your Caregiver"
    });
  } catch (error) {
    console.error("Get Patient Conversation Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages", error: error.message });
  }
};

// ─── Patient: send message to caregiver ──────────────────────────────────────
// POST /api/messages/patient/send
exports.patientSendMessage = async (req, res) => {
  try {
    const patientId = req.session.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const patient = await User.findById(patientId).select("assignedCaregivers");
    if (!patient || !patient.assignedCaregivers.length) {
      return res.status(400).json({ success: false, message: "You have no assigned caregiver to message" });
    }

    const caregiverId = patient.assignedCaregivers[0];

    const message = await Message.create({
      senderId: patientId,
      receiverId: caregiverId,
      content: content.trim(),
      senderRole: "user"
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Patient Send Message Error:", error);
    res.status(500).json({ success: false, message: "Failed to send message", error: error.message });
  }
};

// ─── Caregiver: get list of patients with unread counts ──────────────────────
// GET /api/messages/caregiver/inbox
exports.getCaregiverInbox = async (req, res) => {
  try {
    const caregiverId = req.session.user.id;

    const caregiver = await User.findById(caregiverId).populate("assignedPatients", "fullName email");
    if (!caregiver) return res.status(404).json({ success: false, message: "Caregiver not found" });

    // For each patient, get the last message and unread count
    const inbox = await Promise.all(
      caregiver.assignedPatients.map(async (patient) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: patient._id, receiverId: caregiverId },
            { senderId: caregiverId, receiverId: patient._id }
          ]
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: patient._id,
          receiverId: caregiverId,
          isRead: false
        });

        return {
          patientId: patient._id,
          patientName: patient.fullName,
          patientEmail: patient.email,
          lastMessage: lastMessage ? lastMessage.content : null,
          lastMessageTime: lastMessage ? lastMessage.createdAt : null,
          unreadCount
        };
      })
    );

    // Sort by most recent message
    inbox.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    res.status(200).json({ success: true, inbox });
  } catch (error) {
    console.error("Caregiver Inbox Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch inbox", error: error.message });
  }
};

// ─── Caregiver: get conversation with a specific patient ─────────────────────
// GET /api/messages/caregiver/conversation/:patientId
exports.getCaregiverConversation = async (req, res) => {
  try {
    const caregiverId = req.session.user.id;
    const { patientId } = req.params;

    // Verify access
    const caregiver = await User.findById(caregiverId);
    if (!caregiver.assignedPatients.map(id => id.toString()).includes(patientId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const patient = await User.findById(patientId).select("fullName");

    const messages = await Message.find({
      $or: [
        { senderId: patientId, receiverId: caregiverId },
        { senderId: caregiverId, receiverId: patientId }
      ]
    }).sort({ createdAt: 1 });

    // Mark all patient messages as read
    await Message.updateMany(
      { senderId: patientId, receiverId: caregiverId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      messages,
      patientId,
      patientName: patient?.fullName || "Patient"
    });
  } catch (error) {
    console.error("Caregiver Conversation Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch conversation", error: error.message });
  }
};

// ─── Caregiver: send message to patient ──────────────────────────────────────
// POST /api/messages/caregiver/send
exports.caregiverSendMessage = async (req, res) => {
  try {
    const caregiverId = req.session.user.id;
    const { patientId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    // Verify access
    const caregiver = await User.findById(caregiverId);
    if (!caregiver.assignedPatients.map(id => id.toString()).includes(patientId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const message = await Message.create({
      senderId: caregiverId,
      receiverId: patientId,
      content: content.trim(),
      senderRole: "caregiver"
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Caregiver Send Message Error:", error);
    res.status(500).json({ success: false, message: "Failed to send message", error: error.message });
  }
};

// ─── Get unread count (for badge on navbar) ───────────────────────────────────
// GET /api/messages/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const count = await Message.countDocuments({ receiverId: userId, isRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, count: 0 });
  }
};
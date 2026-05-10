const express = require("express");
const {
  getPatientTasks,
  completeTask,
  getPatientHistory,
  getPatientDashboard,
  getPatientProfile,
  updatePatientProfile,
  getMyPrescriptions     // NEW
} = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Patient Dashboard Routes
router.get("/dashboard", protect, authorize("user"), getPatientDashboard);
router.get("/tasks", protect, authorize("user"), getPatientTasks);
router.post("/tasks/:taskId/complete", protect, authorize("user"), completeTask);
router.get("/history", protect, authorize("user"), getPatientHistory);

// Patient Profile Routes
router.get("/profile", protect, authorize("user"), getPatientProfile);
router.put("/profile", protect, authorize("user"), updatePatientProfile);

// NEW: Patient can view their own prescriptions (read-only)
router.get("/prescriptions", protect, authorize("user"), getMyPrescriptions);

module.exports = router;
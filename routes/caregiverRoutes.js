const express = require("express");
const {
  getAssignedPatients,
  getPatientTasksForCaregiver,
  createTask,
  updateTask,
  deleteTask,
  getCaregiverDashboard,
  addNoteToTask,
  getPatientDetail
} = require("../controllers/caregiverController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Caregiver Dashboard Routes
router.get("/dashboard", protect, authorize("caregiver"), getCaregiverDashboard);
router.get("/patients", protect, authorize("caregiver"), getAssignedPatients);
router.get("/patients/:patientId/tasks", protect, authorize("caregiver"), getPatientTasksForCaregiver);

// NEW: Patient detail view
router.get("/patients/:patientId/detail", protect, authorize("caregiver"), getPatientDetail);

// Task Management
router.post("/tasks", protect, authorize("caregiver"), createTask);
router.put("/tasks/:taskId", protect, authorize("caregiver"), updateTask);
router.delete("/tasks/:taskId", protect, authorize("caregiver"), deleteTask);

// Note Management
router.post("/notes", protect, authorize("caregiver"), addNoteToTask);

module.exports = router;
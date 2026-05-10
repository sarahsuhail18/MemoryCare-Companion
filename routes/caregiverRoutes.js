const express = require("express");
const {
  getAssignedPatients,
  getPatientTasksForCaregiver,
  createTask,
  updateTask,
  deleteTask,
  getCaregiverDashboard,
  addNoteToTask,
  getPatientDetail,
  getPrescriptions,
  addPrescription,
  discontinuePrescription
} = require("../controllers/caregiverController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Caregiver Dashboard Routes
router.get("/dashboard", protect, authorize("caregiver"), getCaregiverDashboard);
router.get("/patients", protect, authorize("caregiver"), getAssignedPatients);
router.get("/patients/:patientId/tasks", protect, authorize("caregiver"), getPatientTasksForCaregiver);
router.get("/patients/:patientId/detail", protect, authorize("caregiver"), getPatientDetail);

// Prescription Routes (NEW)
router.get("/patients/:patientId/prescriptions", protect, authorize("caregiver"), getPrescriptions);
router.post("/patients/:patientId/prescriptions", protect, authorize("caregiver"), addPrescription);
router.patch("/prescriptions/:prescriptionId/discontinue", protect, authorize("caregiver"), discontinuePrescription);

// Task Management
router.post("/tasks", protect, authorize("caregiver"), createTask);
router.put("/tasks/:taskId", protect, authorize("caregiver"), updateTask);
router.delete("/tasks/:taskId", protect, authorize("caregiver"), deleteTask);

// Note Management
router.post("/notes", protect, authorize("caregiver"), addNoteToTask);

module.exports = router;
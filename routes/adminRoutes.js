const express = require("express");

const {
  getAllUsers,
  toggleUserStatus,
  changeUserRole,
  getDashboardStats,
  assignCaregiverToPatient,
  removeAssignment,
  getUsersByRole,
  createAdmin,
  getPendingCaregivers,
  getActivityLog,
  approveCaregiver,
  rejectCaregiver
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-admin", protect, authorize("admin"), createAdmin);

router.get(
  "/dashboard-stats",
  protect,
  authorize("admin"),
  getDashboardStats
);

router.get("/users", protect, authorize("admin"), getAllUsers);

router.get(
  "/users-by-role",
  protect,
  authorize("admin"),
  getUsersByRole
);

router.patch(
  "/users/:id/status",
  protect,
  authorize("admin"),
  toggleUserStatus
);

router.patch(
  "/users/:id/role",
  protect,
  authorize("admin"),
  changeUserRole
);

router.post(
  "/assign-caregiver",
  protect,
  authorize("admin"),
  assignCaregiverToPatient
);

router.delete(
  "/assign-caregiver",
  protect,
  authorize("admin"),
  removeAssignment
);

router.get(
  "/pending-caregivers",
  protect,
  authorize("admin"),
  getPendingCaregivers
);

router.patch(
  "/caregivers/:id/approve",
  protect,
  authorize("admin"),
  approveCaregiver
);

router.patch(
  "/caregivers/:id/reject",
  protect,
  authorize("admin"),
  rejectCaregiver
);

router.get(
  "/activity-log",
  protect,
  authorize("admin"),
  getActivityLog
);

module.exports = router;
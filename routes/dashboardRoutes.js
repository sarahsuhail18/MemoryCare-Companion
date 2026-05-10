const express = require("express");
const path = require("path");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/user/dashboard.html", protect, authorize("user"), (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "user", "dashboard.html"));
});

router.get(
  "/caregiver/dashboard.html",
  protect,
  authorize("caregiver"),
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "public", "caregiver", "dashboard.html")
    );
  }
);

router.get("/admin/dashboard.html", protect, authorize("admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin", "dashboard.html"));
});
router.get(
  "/admin/manage-users.html",
  protect,
  authorize("admin"),
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "public", "admin", "manage-users.html")
    );
  }
);
module.exports = router;
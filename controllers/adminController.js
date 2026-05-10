const User = require("../models/User");
const Log = require("../models/Log"); // NEW

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("fullName email role isActive createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.session.user.id === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    // NEW: Log this action
    await Log.create({
      action: user.isActive ? "account_activated" : "account_deactivated",
      performedBy: req.session.user.email,
      targetUser: user.email,
      details: `Account ${user.isActive ? "activated" : "deactivated"} for ${user.fullName} (${user.role})`
    });

    res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? "activated" : "deactivated"} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message
    });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "caregiver", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // NEW: Log this action
    await Log.create({
      action: "role_changed",
      performedBy: req.session.user.email,
      targetUser: user.email,
      details: `Role changed from "${oldRole}" to "${role}" for ${user.fullName}`
    });

    res.status(200).json({
      success: true,
      message: "User role updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message
    });
  }
};

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    const roleStats = {};
    usersByRole.forEach((stat) => {
      roleStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        byRole: {
          users: roleStats.user || 0,
          caregivers: roleStats.caregiver || 0,
          admins: roleStats.admin || 0
        }
      }
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
};

// Assign caregiver to patient
exports.assignCaregiverToPatient = async (req, res) => {
  try {
    const { caregiverId, patientId } = req.body;

    if (!caregiverId || !patientId) {
      return res.status(400).json({
        success: false,
        message: "Caregiver ID and Patient ID are required"
      });
    }

    const caregiver = await User.findById(caregiverId);
    const patient = await User.findById(patientId);

    if (!caregiver || caregiver.role !== "caregiver") {
      return res.status(404).json({
        success: false,
        message: "Caregiver not found"
      });
    }

    if (!patient || patient.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    if (!caregiver.assignedPatients.includes(patientId)) {
      caregiver.assignedPatients.push(patientId);
      await caregiver.save();
    }

    if (!patient.assignedCaregivers.includes(caregiverId)) {
      patient.assignedCaregivers.push(caregiverId);
      await patient.save();
    }

    res.status(200).json({
      success: true,
      message: "Caregiver assigned to patient successfully"
    });
  } catch (error) {
    console.error("Assign Caregiver Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign caregiver",
      error: error.message
    });
  }
};

// Remove caregiver from patient assignment
exports.removeAssignment = async (req, res) => {
  try {
    const { caregiverId, patientId } = req.body;

    if (!caregiverId || !patientId) {
      return res.status(400).json({
        success: false,
        message: "Caregiver ID and Patient ID are required"
      });
    }

    const caregiver = await User.findById(caregiverId);
    const patient = await User.findById(patientId);

    if (!caregiver) {
      return res.status(404).json({ success: false, message: "Caregiver not found" });
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    caregiver.assignedPatients = caregiver.assignedPatients.filter(
      (id) => id.toString() !== patientId
    );
    await caregiver.save();

    patient.assignedCaregivers = patient.assignedCaregivers.filter(
      (id) => id.toString() !== caregiverId
    );
    await patient.save();

    res.status(200).json({
      success: true,
      message: "Assignment removed successfully"
    });
  } catch (error) {
    console.error("Remove Assignment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove assignment",
      error: error.message
    });
  }
};

// Get all caregivers and patients for assignment
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ success: false, message: "Role parameter is required" });
    }

    if (!["user", "caregiver"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const users = await User.find({ role, isActive: true })
      .select("fullName email role assignedPatients")
      .sort({ fullName: 1 });

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Get Users by Role Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

// Create a new admin account (only callable by existing admin)
exports.createAdmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const admin = await User.create({ fullName, email, password, role: "admin" });

    // NEW: Log this action
    await Log.create({
      action: "admin_created",
      performedBy: req.session.user.email,
      targetUser: email,
      details: `New admin account created for ${fullName} (${email})`
    });

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      user: { id: admin._id, fullName: admin.fullName, email: admin.email, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create admin: " + error.message });
  }
};

// NEW: Get activity log for admin dashboard
exports.getActivityLog = async (req, res) => {
  try {
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Activity Log Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activity log", error: error.message });
  }
};
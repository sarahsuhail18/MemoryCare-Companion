const Task = require("../models/Task");
const Note = require("../models/Note");
const User = require("../models/User");

// Get today's tasks for patient
exports.getPatientTasks = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all tasks for today
    const tasks = await Task.find({
      patientId: userId,
      dueDate: { $gte: today, $lt: tomorrow },
      isActive: true
    }).sort({ scheduledTime: 1 });

    // Enrich tasks with notes
    const tasksWithNotes = await Promise.all(
      tasks.map(async (task) => {
        const notes = await Note.find({ taskId: task._id }).sort({ createdAt: -1 });
        return {
          ...task.toObject(),
          notes
        };
      })
    );

    res.status(200).json({
      success: true,
      tasks: tasksWithNotes,
      count: tasksWithNotes.length
    });
  } catch (error) {
    console.error("Patient Tasks Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message
    });
  }
};

// Mark task as completed and add optional note
exports.completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { note } = req.body;
    const userId = req.session.user.id;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required"
      });
    }

    // Verify task belongs to patient
    const task = await Task.findOne({ _id: taskId, patientId: userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    // Add note if provided
    if (note && note.trim()) {
      await Note.create({
        taskId,
        patientId: userId,
        content: note,
        createdBy: "patient"
      });
    }

    res.status(200).json({
      success: true,
      message: "Task marked as completed",
      task
    });
  } catch (error) {
    console.error("Complete Task Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete task",
      error: error.message
    });
  }
};

// Get patient activity history (past tasks)
exports.getPatientHistory = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { days = 30 } = req.query;

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - parseInt(days));

    const completedTasks = await Task.find({
      patientId: userId,
      status: "completed",
      completedAt: { $gte: pastDate }
    })
      .sort({ completedAt: -1 })
      .limit(100);

    // Calculate statistics
    const totalCompleted = completedTasks.length;

    const tasksByType = {};
    completedTasks.forEach((task) => {
      tasksByType[task.taskType] = (tasksByType[task.taskType] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      history: completedTasks,
      stats: {
        totalCompleted,
        tasksByType,
        daysViewed: parseInt(days)
      }
    });
  } catch (error) {
    console.error("Patient History Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history",
      error: error.message
    });
  }
};

// Get patient dashboard overview
exports.getPatientDashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's tasks
    const todaysTasks = await Task.find({
      patientId: userId,
      dueDate: { $gte: today, $lt: tomorrow },
      isActive: true
    }).sort({ scheduledTime: 1 });

    // Calculate statistics
    const completed = todaysTasks.filter((t) => t.status === "completed").length;
    const pending = todaysTasks.filter((t) => t.status === "pending").length;
    const missed = todaysTasks.filter((t) => t.status === "missed").length;
    const completionPercentage = todaysTasks.length > 0 
      ? Math.round((completed / todaysTasks.length) * 100) 
      : 0;

    // Get user info
    const user = await User.findById(userId);

    const greeting = getGreeting();

    res.status(200).json({
      success: true,
      greeting,
      user: {
        name: user.fullName
      },
      stats: {
        total: todaysTasks.length,
        completed,
        pending,
        missed,
        completionPercentage
      },
      tasksPreview: todaysTasks.slice(0, 5)
    });
  } catch (error) {
    console.error("Patient Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
      error: error.message
    });
  }
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

exports.getGreeting = getGreeting;

// ─── NEW: Patient Profile ────────────────────────────────────────────────────

// GET /api/patient/profile — return the logged-in patient's profile fields
exports.getPatientProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId).select(
      "fullName email dateOfBirth medicalConditions emergencyContact emergencyPhone"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile", error: error.message });
  }
};

// PUT /api/patient/profile — update editable profile fields only
exports.updatePatientProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { dateOfBirth, medicalConditions, emergencyContact, emergencyPhone } = req.body;

    const updated = await User.findByIdAndUpdate(
      userId,
      { dateOfBirth, medicalConditions, emergencyContact, emergencyPhone },
      { new: true, runValidators: true }
    ).select("fullName email dateOfBirth medicalConditions emergencyContact emergencyPhone");

    res.status(200).json({ success: true, message: "Profile updated successfully", user: updated });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
};

// ─── NEW: Patient view their own prescriptions (read-only) ───────────────────
const Prescription = require("../models/Prescription");

exports.getMyPrescriptions = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const prescriptions = await Prescription.find({ patientId: userId })
      .populate("addedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, prescriptions });
  } catch (error) {
    console.error("Get My Prescriptions Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch prescriptions", error: error.message });
  }
};
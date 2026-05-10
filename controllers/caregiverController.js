const Task = require("../models/Task");
const Note = require("../models/Note");
const User = require("../models/User");

// Get caregiver's assigned patients
exports.getAssignedPatients = async (req, res) => {
  try {
    const caregiverId = req.session.user.id;

    const caregiver = await User.findById(caregiverId).populate("assignedPatients");

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: "Caregiver not found"
      });
    }

    res.status(200).json({
      success: true,
      patients: caregiver.assignedPatients || []
    });
  } catch (error) {
    console.error("Assigned Patients Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message
    });
  }
};

// Get patient's tasks with status
exports.getPatientTasksForCaregiver = async (req, res) => {
  try {
    const { patientId } = req.params;
    const caregiverId = req.session.user.id;

    // Verify caregiver has access to patient
    const caregiver = await User.findById(caregiverId);
    if (!caregiver.assignedPatients.includes(patientId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this patient"
      });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Task.find({
      patientId,
      dueDate: { $gte: today, $lt: tomorrow },
      isActive: true
    })
      .sort({ scheduledTime: 1 })
      .populate("patientId", "fullName");

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
      tasks: tasksWithNotes
    });
  } catch (error) {
    console.error("Patient Tasks for Caregiver Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient tasks",
      error: error.message
    });
  }
};

// Create new task for patient
exports.createTask = async (req, res) => {
  try {
    const { patientId, title, description, taskType, scheduledTime, dueDate, isRecurring, recurrencePattern, daysOfWeek } = req.body;
    const caregiverId = req.session.user.id;

    // Validate required fields
    if (!patientId || !title || !scheduledTime || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Verify caregiver has access to patient
    const caregiver = await User.findById(caregiverId);
    if (!caregiver.assignedPatients.includes(patientId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this patient"
      });
    }

    // Parse the date string and create a date at midnight in local timezone
    const dateObj = new Date(dueDate);
    dateObj.setHours(0, 0, 0, 0);

    const task = await Task.create({
      patientId,
      caregiverId,
      title,
      description: description || "",
      taskType: taskType || "routine",
      scheduledTime,
      dueDate: dateObj,
      isRecurring: isRecurring || false,
      recurrencePattern: recurrencePattern || null,
      daysOfWeek: daysOfWeek || [],
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task
    });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message
    });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, taskType, scheduledTime, dueDate, isRecurring, recurrencePattern, daysOfWeek } = req.body;
    const caregiverId = req.session.user.id;

    // Verify task belongs to caregiver's patient
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (task.caregiverId.toString() !== caregiverId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit this task"
      });
    }

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (taskType) task.taskType = taskType;
    if (scheduledTime) task.scheduledTime = scheduledTime;
    if (dueDate) {
      const dateObj = new Date(dueDate);
      dateObj.setHours(0, 0, 0, 0);
      task.dueDate = dateObj;
    }
    if (isRecurring !== undefined) task.isRecurring = isRecurring;
    if (recurrencePattern) task.recurrencePattern = recurrencePattern;
    if (daysOfWeek) task.daysOfWeek = daysOfWeek;

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task
    });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const caregiverId = req.session.user.id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (task.caregiverId.toString() !== caregiverId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this task"
      });
    }

    task.isActive = false;
    await task.save();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message
    });
  }
};

// Get caregiver dashboard overview
exports.getCaregiverDashboard = async (req, res) => {
  try {
    const caregiverId = req.session.user.id;

    // Get caregiver info with assigned patients
    const caregiver = await User.findById(caregiverId).populate("assignedPatients", "fullName");

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: "Caregiver not found"
      });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all today's tasks for all assigned patients
    const allTasks = await Task.find({
      patientId: { $in: caregiver.assignedPatients },
      dueDate: { $gte: today, $lt: tomorrow },
      isActive: true
    }).populate("patientId", "fullName");

    // Calculate statistics and missed alerts
    const stats = {};
    const missedAlerts = [];

    caregiver.assignedPatients.forEach((patient) => {
      const patientTasks = allTasks.filter((t) =>
        t.patientId._id.toString() === patient._id.toString()
      );

      const completed = patientTasks.filter((t) => t.status === "completed").length;
      const missed = patientTasks.filter((t) => t.status === "missed").length;

      stats[patient._id.toString()] = {
        name: patient.fullName,
        total: patientTasks.length,
        completed,
        missed,
        completionPercentage:
          patientTasks.length > 0
            ? Math.round((completed / patientTasks.length) * 100)
            : 0
      };

      // Add missed task alerts
      if (missed > 0) {
        const missedTasks = patientTasks.filter((t) => t.status === "missed");
        missedTasks.forEach((task) => {
          missedAlerts.push({
            patientName: patient.fullName,
            taskTitle: task.title,
            scheduledTime: task.scheduledTime
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      caregiver: {
        name: caregiver.fullName,
        patientsCount: caregiver.assignedPatients.length
      },
      patientStats: stats,
      missedAlerts,
      totalPatients: caregiver.assignedPatients.length
    });
  } catch (error) {
    console.error("Caregiver Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
      error: error.message
    });
  }
};

// Add note to patient's completed task
exports.addNoteToTask = async (req, res) => {
  try {
    const { taskId, content } = req.body;
    const caregiverId = req.session.user.id;

    if (!taskId || !content) {
      return res.status(400).json({
        success: false,
        message: "Task ID and content are required"
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (task.caregiverId.toString() !== caregiverId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add notes to this task"
      });
    }

    const note = await Note.create({
      taskId,
      patientId: task.patientId,
      content,
      createdBy: "caregiver"
    });

    res.status(201).json({
      success: true,
      message: "Note added successfully",
      note
    });
  } catch (error) {
    console.error("Add Note Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add note",
      error: error.message
    });
  }
};

// No need for module.exports as we're using exports. syntax above

// ─── NEW: Get full patient profile for caregiver detail view ─────────────────
exports.getPatientDetail = async (req, res) => {
  try {
    const { patientId } = req.params;
    const caregiverId = req.session.user.id;

    // Verify this caregiver is assigned to this patient
    const caregiver = await User.findById(caregiverId);
    if (!caregiver.assignedPatients.map(id => id.toString()).includes(patientId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const patient = await User.findById(patientId).select(
      "fullName email dateOfBirth medicalConditions emergencyContact emergencyPhone"
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    res.status(200).json({ success: true, patient });
  } catch (error) {
    console.error("Get Patient Detail Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch patient detail", error: error.message });
  }
};
const cron = require("node-cron");
const Task = require("../models/Task");
const User = require("../models/User");
const { sendMissedTaskAlert, sendWeeklySummaryEmail } = require("./email.js");

// ─── HOURLY: Mark overdue pending tasks as missed + email caregiver ──────────
// Runs every hour at :00
cron.schedule("* * * * *", async () => {
  try {
    console.log("[Scheduler] Running missed task check...");

    const now = new Date();

    // Build a cutoff datetime: today's date + scheduled time must be in the past
    // We find all pending tasks whose dueDate is today or earlier
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Find all pending tasks due today or earlier that are still pending
    const overdueTasks = await Task.find({
      status: "pending",
      isActive: true,
      dueDate: { $lte: now }
    });

    // Filter: only mark as missed if scheduled time has already passed today
    const toMark = overdueTasks.filter((task) => {
      // scheduledTime is "HH:MM"
      const [hours, minutes] = task.scheduledTime.split(":").map(Number);
      const scheduledDateTime = new Date(task.dueDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      return scheduledDateTime <= now;
    });

    if (toMark.length === 0) {
      console.log("[Scheduler] No overdue tasks found.");
      return;
    }

    // Mark all as missed
    const taskIds = toMark.map((t) => t._id);
    await Task.updateMany({ _id: { $in: taskIds } }, { status: "missed" });
    console.log(`[Scheduler] Marked ${toMark.length} task(s) as missed.`);

    // ── Email caregiver for each missed task (Feature 4) ──────────────────
    for (const task of toMark) {
      try {
        const caregiver = await User.findById(task.caregiverId).select("email fullName");
        const patient = await User.findById(task.patientId).select("fullName");

        if (caregiver && patient) {
          await sendMissedTaskAlert(caregiver.email, caregiver.fullName, patient.fullName, task);
          console.log(`[Scheduler] Alert sent to ${caregiver.email} for task "${task.title}"`);
        }
      } catch (emailErr) {
        console.error(`[Scheduler] Failed to send alert for task ${task._id}:`, emailErr.message);
      }
    }

  } catch (err) {
    console.error("[Scheduler] Missed task check failed:", err.message);
  }
});

// ─── WEEKLY: Send summary email to each caregiver every Sunday at 8:00 AM ───
cron.schedule("0 8 * * *", async () => {
  try {
    console.log("[Scheduler] Running weekly summary emails...");

    const caregivers = await User.find({ role: "caregiver", isActive: true });

    for (const caregiver of caregivers) {
      try {
        // Get all patients assigned to this caregiver
        const patients = await User.find({
          _id: { $in: caregiver.assignedPatients }
        }).select("fullName");

        if (patients.length === 0) continue;

        // Get last 7 days date range
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Build summary per patient
        const summaries = [];
        for (const patient of patients) {
          const completed = await Task.countDocuments({
            patientId: patient._id,
            caregiverId: caregiver._id,
            status: "completed",
            completedAt: { $gte: sevenDaysAgo }
          });
          const missed = await Task.countDocuments({
            patientId: patient._id,
            caregiverId: caregiver._id,
            status: "missed",
            dueDate: { $gte: sevenDaysAgo }
          });
          summaries.push({ patientName: patient.fullName, completed, missed });
        }

        await sendWeeklySummaryEmail(caregiver.email, caregiver.fullName, summaries);
        console.log(`[Scheduler] Weekly summary sent to ${caregiver.email}`);
      } catch (emailErr) {
        console.error(`[Scheduler] Failed weekly summary for ${caregiver.email}:`, emailErr.message);
      }
    }

  } catch (err) {
    console.error("[Scheduler] Weekly summary failed:", err.message);
  }
});

console.log("[Scheduler] Cron jobs registered: hourly missed-task check, weekly summary.");
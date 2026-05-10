const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    taskType: {
      type: String,
      enum: ["medication", "hydration", "meal", "activity", "appointment", "routine"],
      default: "routine"
    },

    scheduledTime: {
      type: String, // HH:MM format (e.g., "08:00", "14:30")
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "completed", "missed"],
      default: "pending"
    },

    completedAt: {
      type: Date
    },

    dueDate: {
      type: Date,
      required: true
    },

    isRecurring: {
      type: Boolean,
      default: false
    },

    recurrencePattern: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: null
    },

    daysOfWeek: {
      type: [Number], // 0-6 for Sun-Sat
      default: []
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Task", taskSchema);

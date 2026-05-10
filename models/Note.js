const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      required: [true, "Note content is required"],
      trim: true,
      maxlength: 500
    },

    createdBy: {
      type: String,
      enum: ["patient", "caregiver"],
      default: "patient"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Note", noteSchema);

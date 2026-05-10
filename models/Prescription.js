const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true   // caregiver who added it
    },

    medicineName: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true
    },

    dosage: {
      type: String,
      required: [true, "Dosage is required"],
      trim: true        // e.g. "500mg", "10ml"
    },

    frequency: {
      type: String,
      required: [true, "Frequency is required"],
      trim: true        // e.g. "Twice daily", "Every 8 hours"
    },

    instructions: {
      type: String,
      trim: true        // e.g. "Take with food", "Avoid sunlight"
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      default: null     // null means ongoing
    },

    status: {
      type: String,
      enum: ["active", "discontinued"],
      default: "active"
    },

    discontinuedReason: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
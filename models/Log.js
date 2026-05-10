const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
      // e.g. "role_changed", "account_deactivated", "account_activated", "admin_created"
    },

    performedBy: {
      type: String,
      required: true  // admin's email
    },

    targetUser: {
      type: String,
      default: null   // affected user's email
    },

    details: {
      type: String,
      default: ""     // human-readable description
    }
  },
  {
    timestamps: true  // createdAt is the log timestamp
  }
);

module.exports = mongoose.model("Log", logSchema);
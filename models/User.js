const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false
    },

    role: {
      type: String,
      enum: ["user", "caregiver", "admin"],
      default: "user"
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // For caregiver: list of patient IDs they manage
    assignedPatients: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },

    // For patient: list of caregiver IDs assigned to them
    assignedCaregivers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },

    // Patient profile fields
    dateOfBirth: {
      type: Date
    },

    medicalConditions: {
      type: String,
      trim: true
    },

    emergencyContact: {
      type: String,
      trim: true
    },

    emergencyPhone: {
      type: String,
      trim: true
    },

    resetPasswordToken: {
      type: String
    },

    resetPasswordExpire: {
      type: Date
    },

    // ─── Caregiver approval fields ───────────────────────────────────────────
    approvalStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "not_required"
    },

    rejectionReason: {
      type: String,
      default: ""
    },

    // Extra caregiver profile fields collected at signup
    phone: {
      type: String,
      trim: true,
      default: ""
    },

    qualification: {
      type: String,
      trim: true,
      default: ""
    },

    experience: {
      type: String,
      trim: true,
      default: ""
    },

    organization: {
      type: String,
      trim: true,
      default: ""
    },

    bio: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
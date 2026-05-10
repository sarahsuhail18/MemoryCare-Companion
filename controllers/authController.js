const User = require("../models/User");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../config/email");

exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, role, phone, qualification, experience, organization, bio } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!["user", "caregiver"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role. Admin accounts can only be created by an existing admin." });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    if (role === "caregiver" && (!phone || !qualification || !experience || !organization)) {
      return res.status(400).json({ success: false, message: "All caregiver profile fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    const isCaregiver = role === "caregiver";

    const user = await User.create({
      fullName, email, password, role,
      isActive: !isCaregiver,
      approvalStatus: isCaregiver ? "pending" : "not_required",
      phone:         isCaregiver ? phone : "",
      qualification: isCaregiver ? qualification : "",
      experience:    isCaregiver ? experience : "",
      organization:  isCaregiver ? organization : "",
      bio:           isCaregiver ? (bio || "") : ""
    });

    res.status(201).json({
      success: true,
      message: isCaregiver
        ? "Application submitted! Your account is pending admin approval."
        : "Account created successfully",
      pendingApproval: isCaregiver,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Signup Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: "Signup failed: " + error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      // Give specific message based on approval status
      if (user.approvalStatus === "pending") {
        return res.status(403).json({
          success: false,
          message: "Your caregiver application is pending admin approval. Please check back later."
        });
      }
      if (user.approvalStatus === "rejected") {
        return res.status(403).json({
          success: false,
          message: `Your caregiver application was not approved. ${user.rejectionReason ? "Reason: " + user.rejectionReason : "Please contact support for more information."}`
        });
      }
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact admin."
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };

    let redirectUrl = "/user/dashboard.html";

    if (user.role === "caregiver") {
      redirectUrl = "/caregiver/dashboard.html";
    }

    if (user.role === "admin") {
      redirectUrl = "/admin/dashboard.html";
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      redirectUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }

    res.clearCookie("connect.sid");

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  });
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal whether email exists — security best practice
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a reset link has been sent."
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password.html?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
      res.status(200).json({
        success: true,
        message: "Password reset link sent to your email. Check your inbox (and spam folder)."
      });
    } catch (emailError) {
      // Roll back token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email send error:", emailError.message);
      res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please check your email configuration."
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message
    });
  }
};

// ─── NEW: Change Password (logged-in user) ───────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must include uppercase, lowercase, and a number" });
    }

    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const user = await User.findById(req.session.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password using bcrypt comparison (secure — not string equality)
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to change password", error: error.message });
  }
};
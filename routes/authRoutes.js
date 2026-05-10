const express = require("express");
const { body, validationResult } = require("express-validator");
const { signup, login, logout, forgotPassword, resetPassword } = require("../controllers/authController");

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post("/signup",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Please enter a valid email address").normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must include uppercase, lowercase, and a number"),
    body("role").isIn(["user", "caregiver"]).withMessage("Invalid role selected")
  ],
  handleValidation,
  signup
);

router.post("/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
  ],
  handleValidation,
  login
);

router.post("/logout", logout);
router.post("/forgot-password", body("email").isEmail().withMessage("Valid email required"), handleValidation, forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─── EXISTING: Password Reset Email ─────────────────────────────────────────
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const mailOptions = {
    from: `"MemoryCare Companion" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request — MemoryCare Companion",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e2ece9; border-radius: 10px;">
        <h2 style="color: #2d4a4b;">Reset Your Password</h2>
        <p style="color: #555;">You requested a password reset for your MemoryCare Companion account.</p>
        <p style="color: #555;">Click the button below to create a new password. This link expires in <strong>15 minutes</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #7db8bc; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Reset My Password
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
        <hr style="border: none; border-top: 1px solid #e2ece9; margin: 20px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">&copy; 2026 MemoryCare Companion</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// ─── NEW: Missed Task Alert Email (Feature 4) ────────────────────────────────
const sendMissedTaskAlert = async (toEmail, caregiverName, patientName, task) => {
  const mailOptions = {
    from: `"MemoryCare Companion" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `⚠️ Missed Task Alert — ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #f5c6cb; border-radius: 10px; background: #fff8f8;">
        <h2 style="color: #721c24;">⚠️ Missed Task Alert</h2>
        <p style="color: #555;">Hi <strong>${caregiverName}</strong>,</p>
        <p style="color: #555;">A task assigned to your patient <strong>${patientName}</strong> was not completed on time.</p>
        <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background:#f8d7da;">
            <td style="padding: 10px; font-weight:600; color:#721c24; border-radius:6px 0 0 6px;">Task</td>
            <td style="padding: 10px; color:#333;">${task.title}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight:600; color:#555;">Type</td>
            <td style="padding: 10px; color:#333; text-transform:capitalize;">${task.taskType}</td>
          </tr>
          <tr style="background:#fdf2f2;">
            <td style="padding: 10px; font-weight:600; color:#555;">Scheduled Time</td>
            <td style="padding: 10px; color:#333;">${task.scheduledTime}</td>
          </tr>
        </table>
        <p style="color: #555;">Please follow up with your patient as soon as possible.</p>
        <hr style="border: none; border-top: 1px solid #f5c6cb; margin: 20px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">&copy; 2026 MemoryCare Companion</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// ─── NEW: Weekly Summary Email to Caregiver (Feature 7) ─────────────────────
const sendWeeklySummaryEmail = async (toEmail, caregiverName, summaries) => {
  const rows = summaries.map(s => `
    <tr>
      <td style="padding: 10px; color:#333; border-bottom:1px solid #e8f0f0;">${s.patientName}</td>
      <td style="padding: 10px; text-align:center; color:#155724; font-weight:600; border-bottom:1px solid #e8f0f0;">${s.completed}</td>
      <td style="padding: 10px; text-align:center; color:#721c24; font-weight:600; border-bottom:1px solid #e8f0f0;">${s.missed}</td>
    </tr>
  `).join("");

  const mailOptions = {
    from: `"MemoryCare Companion" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "📋 Weekly Patient Summary — MemoryCare Companion",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 30px; border: 1px solid #e2ece9; border-radius: 10px;">
        <h2 style="color: #2d4a4b;">Weekly Summary</h2>
        <p style="color: #555;">Hi <strong>${caregiverName}</strong>, here's your patients' task summary for the past 7 days.</p>
        <table style="width:100%; border-collapse:collapse; margin: 20px 0;">
          <thead>
            <tr style="background:#e8f5f5;">
              <th style="padding:10px; text-align:left; color:#2d4a4b;">Patient</th>
              <th style="padding:10px; text-align:center; color:#155724;">Completed</th>
              <th style="padding:10px; text-align:center; color:#721c24;">Missed</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <p style="color: #999; font-size: 13px;">Stay on top of your patients' care. Log in to MemoryCare for full details.</p>
        <hr style="border: none; border-top: 1px solid #e2ece9; margin: 20px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">&copy; 2026 MemoryCare Companion</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendMissedTaskAlert, sendWeeklySummaryEmail };
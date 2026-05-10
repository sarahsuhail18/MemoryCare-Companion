const express = require("express");
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const caregiverRoutes = require("./routes/caregiverRoutes");
const messageRoutes = require("./routes/messageRoutes"); // NEW
const session = require("express-session");
const MongoStore = require("connect-mongo");
const dashboardRoutes = require("./routes/dashboardRoutes"); 
connectDB();

// Auto-create default admin if none exists
const User = require("./models/User");
async function seedDefaultAdmin() {
  const adminExists = await User.findOne({ role: "admin" });
  if (!adminExists) {
    await User.create({
      fullName: "System Admin",
      email: process.env.ADMIN_EMAIL || "admin@memorycare.com",
      password: process.env.ADMIN_PASSWORD || "Admin@1234",
      role: "admin"
    });
    console.log("Default admin created: admin@memorycare.com / Admin@1234");
  }
}
setTimeout(seedDefaultAdmin, 2000);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "temporary_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
      httpOnly: true,
      maxAge: 30 * 60 * 1000
    }
  })
);
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/caregiver", caregiverRoutes);
app.use("/api/messages", messageRoutes); // NEW
app.use("/", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running`);
    });
}

module.exports = app;
// NEW: Start cron scheduler after server is up
require("./config/scheduler");
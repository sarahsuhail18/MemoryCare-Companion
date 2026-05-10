// This script creates test users for each role
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");
const Task = require("./models/Task");

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    console.log("Cleared existing data");

    // Create test users
    const adminUser = await User.create({
      fullName: "Admin User",
      email: "admin@test.com",
      password: "admin@12345",
      role: "admin",
      isActive: true
    });
    console.log("✓ Admin user created: admin@test.com");

    const caregiverUser = await User.create({
      fullName: "Sarah Caregiver",
      email: "sarah@test.com",
      password: "sarah@12345",
      role: "caregiver",
      isActive: true
    });
    console.log("✓ Caregiver user created: sarah@test.com");

    const patientUser = await User.create({
      fullName: "Ayesha Patient",
      email: "ayesha@test.com",
      password: "ayesha@12345",
      role: "user",
      isActive: true,
      dateOfBirth: new Date("1960-01-15"),
      medicalConditions: "Hypertension, Diabetes",
      emergencyContact: "Fatima Khan",
      emergencyPhone: "03001234567"
    });
    console.log("✓ Patient user created: ayesha@test.com");

    // Link caregiver to patient
    caregiverUser.assignedPatients.push(patientUser._id);
    await caregiverUser.save();

    patientUser.assignedCaregivers.push(caregiverUser._id);
    await patientUser.save();
    console.log("✓ Linked caregiver to patient");

    // Create test tasks for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const testTasks = [
      {
        patientId: patientUser._id,
        caregiverId: caregiverUser._id,
        title: "Morning Medicine",
        description: "Take hypertension medication with breakfast",
        taskType: "medication",
        scheduledTime: "08:00",
        dueDate: today,
        status: "pending"
      },
      {
        patientId: patientUser._id,
        caregiverId: caregiverUser._id,
        title: "Drink Water",
        description: "Drink at least 8 glasses of water today",
        taskType: "hydration",
        scheduledTime: "10:00",
        dueDate: today,
        status: "pending"
      },
      {
        patientId: patientUser._id,
        caregiverId: caregiverUser._id,
        title: "Breakfast",
        description: "Eat a healthy breakfast",
        taskType: "meal",
        scheduledTime: "07:30",
        dueDate: today,
        status: "completed",
        completedAt: new Date()
      },
      {
        patientId: patientUser._id,
        caregiverId: caregiverUser._id,
        title: "Blood Pressure Check",
        description: "Monitor blood pressure in the morning",
        taskType: "routine",
        scheduledTime: "08:30",
        dueDate: today,
        status: "pending"
      },
      {
        patientId: patientUser._id,
        caregiverId: caregiverUser._id,
        title: "Evening Walk",
        description: "30-minute light walk for exercise",
        taskType: "activity",
        scheduledTime: "17:00",
        dueDate: today,
        status: "pending"
      },
      {
        patientId: patientUser._id,
        caregiverId: caregiverUser._id,
        title: "Evening Medicine",
        description: "Take evening medications",
        taskType: "medication",
        scheduledTime: "20:00",
        dueDate: today,
        status: "missed"
      }
    ];

    const createdTasks = await Task.insertMany(testTasks);
    console.log(`✓ Created ${createdTasks.length} test tasks`);

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nTest Credentials:");
    console.log("=================");
    console.log("Admin:     admin@test.com / admin@12345");
    console.log("Caregiver: sarah@test.com / sarah@12345");
    console.log("Patient:   ayesha@test.com / ayesha@12345");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    process.exit(1);
  }
}

seedData();

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");

async function seedAdmin() {
  try {
    const adminEmail = "admin@projectflow.com";

    // Check if admin already exists
    const [existing] = await pool.execute(
      "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL",
      [adminEmail]
    );

    if (existing.length > 0) {
      console.log("⚠️ Admin already exists. Skipping...");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await pool.execute(
      `INSERT INTO users (id, name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        "Super Admin",
        adminEmail,
        hashedPassword,
        "ADMIN"
      ]
    );

    console.log("✅ Admin user created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
}

seedAdmin();

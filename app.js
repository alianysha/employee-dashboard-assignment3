
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist", "Frontend")));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) =>
    console.error("MongoDB connection error:", err.message)
  );

// Employee model
const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

// User model
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const routes = ["/api/employeelist", "/employeelist"];
const idRoutes = [
  "/api/employeelist/:id",
  "/employeelist/:id"
];

// Check required authentication configuration
const authConfigured = Boolean(process.env.JWT_SECRET);

if (!authConfigured) {
  console.error("JWT_SECRET is missing from .env");
}

// Authentication middleware
function authMiddleware(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: "Authentication is not configured"
    });
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Please log in first"
    });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired login token"
    });
  }
}

// Register account
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        error: "Enter a valid email and a password of at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Email is already registered"
      });
    }

    console.error("Registration failed:", err.message);
    res.status(500).json({
      error: "Could not register account"
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error("Login failed:", err.message);
    res.status(500).json({
      error: "Could not log in"
    });
  }
});

// Get current account
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("_id email");

    if (!user) {
      return res.status(401).json({ error: "Account not found" });
    }

    res.json({
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error("Account lookup failed:", err.message);
    res.status(500).json({ error: "Could not retrieve account" });
  }
});

// Get all employees
app.get(routes, authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error("Employee query failed:", err);
    res.status(500).json({
      error: "Failed to retrieve employees"
    });
  }
});

// Get one employee
app.get(idRoutes, authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employee);
  } catch (err) {
    console.error("Find employee failed:", err);
    res.status(500).json({
      error: "Failed to retrieve employee"
    });
  }
});

// Add employee
app.post(routes, authMiddleware, async (req, res) => {
  try {
    const { name, location, position, salary } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof location !== "string" ||
      !location.trim() ||
      typeof position !== "string" ||
      !position.trim() ||
      salary === undefined ||
      salary === null ||
      salary === "" ||
      !Number.isFinite(Number(salary)) ||
      Number(salary) < 0
    ) {
      return res.status(400).json({
        error: "Valid employee details are required"
      });
    }

    const employee = await Employee.create({
      name: name.trim(),
      location: location.trim(),
      position: position.trim(),
      salary: Number(salary)
    });

    res.status(201).json(employee);
  } catch (err) {
    console.error("Add employee failed:", err);
    res.status(500).json({
      error: "Failed to add employee"
    });
  }
});

// Delete employee
app.delete(idRoutes, authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Delete employee failed:", err);
    res.status(500).json({
      error: "Failed to delete employee"
    });
  }
});

// Update employee
app.put(routes, authMiddleware, async (req, res) => {
  try {
    const { _id, id, name, location, position, salary } = req.body;
    const employeeId = _id || id;

    if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        error: "A valid employee ID is required"
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof location !== "string" ||
      !location.trim() ||
      typeof position !== "string" ||
      !position.trim() ||
      salary === undefined ||
      salary === null ||
      salary === "" ||
      !Number.isFinite(Number(salary)) ||
      Number(salary) < 0
    ) {
      return res.status(400).json({
        error: "Valid employee details are required"
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      {
        name: name.trim(),
        location: location.trim(),
        position: position.trim(),
        salary: Number(salary)
      },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employee);
  } catch (err) {
    console.error("Update employee failed:", err);
    res.status(500).json({
      error: "Failed to update employee"
    });
  }
});

// Serve existing frontend files
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "Frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

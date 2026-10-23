
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve the provided frontend
app.use(express.static(path.join(__dirname, "dist", "Frontend")));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Employee schema and model
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  position: { type: String, required: true },
  salary: { type: Number, required: true }
});

const Employee = mongoose.model("Employee", employeeSchema);

// Support both API path formats used by the assignment and frontend.
const routes = ["/api/employeelist", "/employeelist"];

// GET: Retrieve all employees
app.get(routes, async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve employees" });
  }
});

// GET: Retrieve one employee by ID
app.get(
  ["/api/employeelist/:id", "/employeelist/:id"],
  async (req, res) => {
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
      res.status(500).json({ error: "Failed to retrieve employee" });
    }
  }
);

// POST: Add an employee
app.post(routes, async (req, res) => {
  try {
    const { name, location, position, salary } = req.body;

    if (
      !name?.trim() ||
      !location?.trim() ||
      !position?.trim() ||
      salary === undefined ||
      salary === null ||
      salary === "" ||
      !Number.isFinite(Number(salary)) ||
      Number(salary) < 0
    ) {
      return res.status(400).json({ error: "Valid employee details are required" });
    }

    const employee = await Employee.create({
      name: name.trim(),
      location: location.trim(),
      position: position.trim(),
      salary: Number(salary)
    });

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: "Failed to add employee" });
  }
});

// DELETE: Remove an employee
app.delete(
  ["/api/employeelist/:id", "/employeelist/:id"],
  async (req, res) => {
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
      res.status(500).json({ error: "Failed to delete employee" });
    }
  }
);

// PUT: Update an employee using the ID in the request body
app.put(routes, async (req, res) => {
  try {
    const { _id, id, name, location, position, salary } = req.body;
    const employeeId = _id || id;

    if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({ error: "A valid employee ID is required" });
    }

    if (
      !name?.trim() ||
      !location?.trim() ||
      !position?.trim() ||
      salary === undefined ||
      salary === null ||
      salary === "" ||
      !Number.isFinite(Number(salary)) ||
      Number(salary) < 0
    ) {
      return res.status(400).json({ error: "Valid employee details are required" });
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
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// Keep the provided frontend connection.
// Express 5-compatible catch-all route:
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "Frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

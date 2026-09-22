const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "employee_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres"
});

function validateEmployeeInput(name, email) {
  const trimmedName = String(name || "").trim();
  const trimmedEmail = String(email || "").trim();

  if (!trimmedName || !trimmedEmail) {
    return { valid: false, error: "Name and email are required" };
  }

  if (trimmedName.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters long" };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true, name: trimmedName, email: trimmedEmail };
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Database table is ready");
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "UP",
      application: "backend",
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({
      status: "DOWN",
      database: "disconnected"
    });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM employees ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const { name, email } = req.body;
    const validation = validateEmployeeInput(name, email);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await pool.query(
      "INSERT INTO employees (name, email) VALUES ($1, $2) RETURNING *",
      [validation.name, validation.email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Email already exists"
      });
    }

    console.error(error);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const validation = validateEmployeeInput(name, email);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await pool.query(
      "UPDATE employees SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [validation.name, validation.email, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }

    console.error(error);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "DevOps 3-Tier Backend API" });
});

async function start() {
  try {
    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

start();

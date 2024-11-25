const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Add logging for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  if (req.body) console.log("Body:", req.body);
  next();
});

// Create MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "2a",
  port: 3306,
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// Status endpoint
app.get("/status", (req, res) => {
  console.log("Status check received");
  db.query("SELECT 1", (err) => {
    if (err) {
      console.log("Database check failed:", err);
      res.json({
        success: false,
        message: "Database connection failed",
        error: err.message,
        database: false,
        server: true,
      });
    } else {
      console.log("Database check successful");
      res.json({
        success: true,
        message: "All systems operational",
        database: true,
        server: true,
      });
    }
  });
});

// Add a simple test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM user WHERE name = ? AND password = ?";

  db.query(query, [username, password], (err, results) => {
    if (err) {
      res.json({ success: false, message: "Database error" });
      return;
    }

    if (results.length > 0) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.json({ success: false, message: "Invalid username or password" });
    }
  });
});

// Add this new endpoint
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  // Insert new user
  const query = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";
  db.query(query, [name, email, password], (err, results) => {
    if (err) {
      console.error("Signup error:", err);
      // Check for duplicate email
      if (err.code === "ER_DUP_ENTRY") {
        return res.json({
          success: false,
          message: "Email already exists",
        });
      }
      return res.json({
        success: false,
        message: "Database error",
      });
    }

    res.json({
      success: true,
      message: "User registered successfully",
    });
  });
});

const PORT = 3001;
const IP = "192.168.1.23"; // Your IP address

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
  console.log(`For mobile devices use: http://${IP}:${PORT}`);
});

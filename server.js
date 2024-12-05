const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs").promises;
const sharp = require("sharp");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const app = express();
app.use(
  cors({
    origin: ["http://192.168.254.112:3000", "http://localhost:3000"],
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
  database: "evsu_canteen",
  typeCast: function (field, next) {
    if (field.type === "BLOB" || field.type === "MEDIUMBLOB") {
      return field.buffer();
    }
    return next();
  },
  multipleStatements: true,
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
  res.json({ message: "Server is running" });
});

// Login endpoint
app.post("/login", (req, res) => {
  console.log("Login request received:", req.body);
  const { username, password } = req.body;
  const query = "SELECT * FROM customers WHERE name = ? AND password = ?";

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Login error:", err);
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
  const query =
    "INSERT INTO customers (name, email, password) VALUES (?, ?, ?)";
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

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
  console.log(`For mobile devices use: http://192.168.254.112:${PORT}`);
});
// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: "your-email@gmail.com", // Your email
    pass: "your-email-password", // Your email password
  },
});

// Function to send OTP email
const sendEmail = (email, otp) => {
  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

// Forgot password endpoint
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000); // Generate 4-digit OTP
  console.log("Forgot Password request received:", { email, otp });

  sendEmail(email, otp, (error) => {
    if (error) {
      console.error("Error sending OTP:", error);
      return res
        .status(500)
        .json({ message: "Failed to send OTP. Please try again later." });
    }
    res.status(200).json({ message: "OTP sent to your email." });
  });
});

// Add logging for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  if (req.body) console.log("Body:", req.body);
  next();
});

app.post("/api/update-profile", upload.none(), async (req, res) => {
  try {
    const { username, profilePic } = req.body;

    // Validate inputs
    if (!username || !profilePic) {
      return res.status(400).json({
        success: false,
        message: "Username and profile picture are required",
      });
    }

    // Convert base64 to binary
    const imageBuffer = Buffer.from(profilePic, "base64");

    // Update profile in database using 'user' table
    const query = "UPDATE user SET profile_pic = ? WHERE name = ?";
    db.query(query, [imageBuffer, username], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (result.affectedRows > 0) {
        res.json({
          success: true,
          message: "Profile updated successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get profile endpoint

// Add this endpoint to update password by email
app.post("/reset-password", (req, res) => {
  console.log("Reset password request received:", req.body);

  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.json({
      success: false,
      message: "Email and new password are required",
    });
  }

  // First check if email exists
  const checkEmailQuery = "SELECT * FROM user WHERE email = ?";

  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      console.error("Database error during email check:", err);
      return res.json({
        success: false,
        message: "Database error",
      });
    }

    if (results.length === 0) {
      return res.json({
        success: false,
        message: "Email not found",
      });
    }

    // If email exists, update the password
    const updateQuery = "UPDATE user SET password = ? WHERE email = ?";

    db.query(updateQuery, [newPassword, email], (err, result) => {
      if (err) {
        console.error("Database error during password update:", err);
        return res.json({
          success: false,
          message: "Failed to update password",
        });
      }

      if (result.affectedRows > 0) {
        console.log("Password updated successfully for email:", email);
        res.json({
          success: true,
          message: "Password updated successfully",
        });
      } else {
        console.log("No rows affected for email:", email);
        res.json({
          success: false,
          message: "Failed to update password",
        });
      }
    });
  });
});

// Add this status endpoint
app.get("/status", (req, res) => {
  res.json({ status: "Server is running" });
});

// Add this endpoint to get stores for student dashboard
app.get("/vendors", (req, res) => {
  console.log("Fetching vendors...");

  const query =
    'SELECT name, stall_name FROM vendors WHERE Status = "Approved"';

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch vendors",
        error: err.message,
      });
    }

    console.log("Vendors fetched:", results);

    res.json({
      success: true,
      stores: results,
    });
  });
});

// Add this endpoint to fetch products
app.get("/items/:vendorUsername", (req, res) => {
  const { vendorUsername } = req.params;
  const { category } = req.query;

  // Log the received parameters
  console.log("Fetching items for:", { vendorUsername, category });

  let query =
    "SELECT item_name, item_image, Price, Category FROM items WHERE vendor_username = ?";
  let queryParams = [vendorUsername];

  if (category) {
    // Use BINARY for exact case-sensitive matching
    query += " AND BINARY Category = ?";
    queryParams.push(category);
  }

  console.log("Executing query:", query, queryParams);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch items",
      });
    }

    try {
      const itemsWithImages = results.map((item) => ({
        ...item,
        item_image: item.item_image
          ? `data:image/jpeg;base64,${item.item_image.toString("base64")}`
          : null,
      }));

      console.log(`Found ${itemsWithImages.length} items`);
      console.log(
        "Categories found:",
        itemsWithImages.map((i) => i.Category)
      );

      res.json({
        success: true,
        products: itemsWithImages,
      });
    } catch (error) {
      console.error("Error processing images:", error);
      res.json({
        success: false,
        message: "Error processing images",
        error: error.message,
      });
    }
  });
});

app.get("/items", (req, res) => {
  console.log("Fetching items...");

  const query = `
    SELECT 
      item_name, 
      item_image, 
      Price, 
      vendor_username,
      Category 
    FROM items
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch items",
        error: err.message,
      });
    }

    try {
      const itemsWithImages = results.map((item) => ({
        item_name: item.item_name,
        item_image: item.item_image
          ? `data:image/jpeg;base64,${item.item_image.toString("base64")}`
          : null,
        Price: item.Price,
        vendor_username: item.vendor_username,
        Category: item.Category,
      }));

      console.log("Items fetched successfully, count:", itemsWithImages.length);

      // Log a sample item to verify the structure
      if (itemsWithImages.length > 0) {
        console.log("Sample item:", {
          item_name: itemsWithImages[0].item_name,
          Price: itemsWithImages[0].Price,
          vendor_username: itemsWithImages[0].vendor_username,
        });
      }

      res.json({
        success: true,
        products: itemsWithImages,
      });
    } catch (error) {
      console.error("Error processing images:", error);
      res.json({
        success: false,
        message: "Error processing images",
        error: error.message,
      });
    }
  });
});
// Update multer configuration for mobile uploads

app.post("/products", upload.single("ImageItem"), async (req, res) => {
  console.log("Received upload request");
  console.log("Body:", {
    ItemName: req.body.ItemName,
    Price: req.body.Price,
  });

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file received",
      });
    }

    // Resize and optimize the image
    const optimizedImageBuffer = await sharp(req.file.buffer)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    console.log("Original size:", req.file.size);
    console.log("Optimized size:", optimizedImageBuffer.length);

    const { ItemName, Price } = req.body;
    const StoreName = req.body.StoreName || "Default Store";

    const query =
      "INSERT INTO Products (ItemName, Price, ImageItem, StoreName) VALUES (?, ?, ?, ?)";

    db.query(
      query,
      [ItemName, Price, optimizedImageBuffer, StoreName],
      (err, result) => {
        if (err) {
          console.error("Database error details:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to add item to database",
            error: err.message,
          });
        }

        console.log("Product added successfully, ID:", result.insertId);
        res.status(200).json({
          success: true,
          message: "Item added successfully",
          productId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing request",
      error: error.message,
    });
  }
});

app.post("/vendor_signup", async (req, res) => {
  const { vendorName, email, password } = req.body;

  if (!vendorName || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO vendors (vendorName, email, password) VALUES (?, ?, ?)",
      [vendorName, email, password]
    );
    res.json({ success: true, message: "Vendor registered successfully" });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Update this endpoint to fetch products by StoreName
app.get("/products/:storeName", (req, res) => {
  const { storeName } = req.params;
  const { category } = req.query;

  // Log the received parameters
  console.log("Fetching products for:", { storeName, category });

  let query =
    "SELECT itemName, ImageItem, price, category FROM products WHERE StoreName = ?";
  let queryParams = [storeName];

  if (category) {
    // Use BINARY for exact case-sensitive matching
    query += " AND BINARY category = ?";
    queryParams.push(category);
  }

  console.log("Executing query:", query, queryParams);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch products",
      });
    }

    try {
      const productsWithImages = results.map((product) => ({
        ...product,
        ImageItem: product.ImageItem
          ? `data:image/jpeg;base64,${product.ImageItem.toString("base64")}`
          : null,
      }));

      console.log(`Found ${productsWithImages.length} products`);
      console.log(
        "Categories found:",
        productsWithImages.map((p) => p.category)
      );

      res.json({
        success: true,
        products: productsWithImages,
      });
    } catch (error) {
      console.error("Error processing images:", error);
      res.json({
        success: false,
        message: "Error processing images",
        error: error.message,
      });
    }
  });
});

// New endpoint to fetch products by StoreName and Category
app.get("/categories/:storeName", (req, res) => {
  const { storeName } = req.params;
  const { category } = req.query;

  console.log("Request received with:", {
    storeName: storeName,
    category: category,
  });

  const query = `
    SELECT itemName, ImageItem, price, category, StoreName
    FROM products 
    WHERE LOWER(StoreName) = LOWER(?) 
    AND LOWER(category) = LOWER(?)
  `;

  console.log("Executing query with params:", [storeName, category]);

  db.query(query, [storeName, category], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch category products",
        error: err.message,
      });
    }

    try {
      const productsWithImages = results.map((product) => ({
        ...product,
        ImageItem: product.ImageItem
          ? `data:image/jpeg;base64,${product.ImageItem.toString("base64")}`
          : null,
      }));

      console.log(
        `Found ${productsWithImages.length} products for ${storeName} in ${category}`
      );

      res.json({
        success: true,
        products: productsWithImages,
      });
    } catch (error) {
      console.error("Error processing images:", error);
      res.json({
        success: false,
        message: "Error processing images",
        error: error.message,
      });
    }
  });
});

app.get("/customer/profile/:username", (req, res) => {
  const { username } = req.params;
  console.log("Fetching profile for username:", username);

  const query = "SELECT profile_image FROM customers WHERE name = ?";

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch profile",
        error: err.message,
      });
    }

    try {
      if (results.length > 0 && results[0].profile_image) {
        const profile_image = results[0].profile_image.toString("base64");
        console.log("Profile image found for:", username);
        res.json({
          success: true,
          profile_image: profile_image,
        });
      } else {
        console.log("No profile image found for:", username);
        res.json({
          success: true,
          profile_image: null,
        });
      }
    } catch (error) {
      console.error("Error processing profile image:", error);
      res.json({
        success: false,
        message: "Error processing profile image",
        error: error.message,
      });
    }
  });
});

app.get("/customer/profile/:username", (req, res) => {
  const { username } = req.params;
  console.log("Fetching profile for username:", username);

  const query = "SELECT profile_image FROM customers WHERE name = ?";

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch profile",
        error: err.message,
      });
    }

    try {
      if (results.length > 0 && results[0].profile_image) {
        const profile_image = results[0].profile_image.toString("base64");
        console.log("Profile image found for:", username);
        res.json({
          success: true,
          profile_image: profile_image,
        });
      } else {
        console.log("No profile image found for:", username);
        res.json({
          success: true,
          profile_image: null,
        });
      }
    } catch (error) {
      console.error("Error processing profile image:", error);
      res.json({
        success: false,
        message: "Error processing profile image",
        error: error.message,
      });
    }
  });
});

app.post(
  "/customer/profile/update",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const profileImage = req.file ? req.file.buffer : null;

      console.log("Updating profile for username:", username);

      let query = "UPDATE customers SET ";
      const queryParams = [];
      const updates = [];

      if (profileImage) {
        updates.push("profile_image = ?");
        queryParams.push(profileImage);
      }

      if (password) {
        updates.push("password = ?");
        queryParams.push(password);
      }

      if (updates.length === 0) {
        return res.json({
          success: false,
          message: "No updates provided",
        });
      }

      query += updates.join(", ");
      query += " WHERE name = ?";
      queryParams.push(username);

      console.log("Executing query:", query);

      db.query(query, queryParams, (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.json({
            success: false,
            message: "Failed to update profile",
            error: err.message,
          });
        }

        if (results.affectedRows > 0) {
          res.json({
            success: true,
            message: "Profile updated successfully",
          });
        } else {
          res.json({
            success: false,
            message: "No profile found to update",
          });
        }
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

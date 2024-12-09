const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs").promises;
const sharp = require("sharp");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const app = express();
app.use(
  cors({
    origin: ["http://192.168.0.106:3000", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
app.post("/login", async (req, res) => {
  console.log("Login request received:", req.body);
  const { username, password } = req.body;

  // Query to check for either username or email
  const query = "SELECT * FROM customers WHERE username = ? OR email = ?";

  db.query(query, [username, username], async (err, results) => {
    if (err) {
      console.error("Login error:", err);
      res.json({ success: false, message: "Database error" });
      return;
    }

    if (results.length > 0) {
      try {
        // Compare the provided password with the hashed password
        const match = await bcrypt.compare(password, results[0].password);

        if (match) {
          // Password matches, send back user info including the name
          res.json({
            success: true,
            message: "Login successful",
            student_id: results[0].id,
            username: results[0].username,
            name: results[0].name,
            email: results[0].email,
          });
        } else {
          res.json({
            success: false,
            message: "Invalid password",
          });
        }
      } catch (error) {
        console.error("Password comparison error:", error);
        res.json({
          success: false,
          message: "Error verifying password",
        });
      }
    } else {
      res.json({
        success: false,
        message: "User not found",
      });
    }
  });
});

// Add this new endpoint
app.post("/signup", async (req, res) => {
  const { name, username, email, password } = req.body;

  // Basic validation
  if (!name || !username || !email || !password) {
    return res.json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if username or email already exists
    const checkQuery =
      "SELECT * FROM customers WHERE username = ? OR email = ?";
    db.query(checkQuery, [username, email], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Database check error:", checkErr);
        return res.json({
          success: false,
          message: "Database error",
        });
      }

      if (checkResults.length > 0) {
        return res.json({
          success: false,
          message: "Username or email already exists",
        });
      }

      // Insert new user
      const insertQuery =
        "INSERT INTO customers (name, username, email, password) VALUES (?, ?, ?, ?)";
      db.query(
        insertQuery,
        [name, username, email, hashedPassword],
        (err, results) => {
          if (err) {
            console.error("Signup error:", err);
            return res.json({
              success: false,
              message: "Failed to create account",
            });
          }

          res.json({
            success: true,
            message: "User registered successfully",
          });
        }
      );
    });
  } catch (error) {
    console.error("Password hashing error:", error);
    res.json({
      success: false,
      message: "Error creating account",
    });
  }
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
app.get("/categories/:vendorUsername", (req, res) => {
  const { vendorUsername } = req.params;
  const { category } = req.query;

  console.log("Request received with:", {
    vendorUsername: vendorUsername,
    category: category,
  });

  const query = `
    SELECT item_name, item_image, Price, Category, vendor_username
    FROM items 
    WHERE LOWER(vendor_username) = LOWER(?) 
    AND LOWER(Category) = LOWER(?)
  `;

  console.log("Executing query with params:", [vendorUsername, category]);

  db.query(query, [vendorUsername, category], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch category items",
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
        Category: item.Category,
        vendor_username: item.vendor_username,
      }));

      console.log(
        `Found ${itemsWithImages.length} items for ${vendorUsername} in ${category}`
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
      let updateQuery = "UPDATE customers SET";
      let queryParams = [];
      let updates = [];

      // If username is provided, add it to the update
      if (username) {
        updates.push(" name = ?");
        queryParams.push(username);
      }

      // If password is provided, hash it before updating
      if (password) {
        try {
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          updates.push(" password = ?");
          queryParams.push(hashedPassword);
        } catch (hashError) {
          console.error("Password hashing error:", hashError);
          return res.status(500).json({
            success: false,
            message: "Error processing password update",
          });
        }
      }

      // Handle profile image if provided
      if (req.file) {
        try {
          const resizedImage = await sharp(req.file.buffer)
            .resize(300, 300)
            .jpeg({ quality: 90 })
            .toBuffer();

          updates.push(" profile_image = ?");
          queryParams.push(resizedImage);
        } catch (imageError) {
          console.error("Image processing error:", imageError);
          return res.status(500).json({
            success: false,
            message: "Error processing image",
          });
        }
      }

      // If no updates provided
      if (updates.length === 0) {
        return res.json({
          success: false,
          message: "No updates provided",
        });
      }

      // Complete the query
      updateQuery += updates.join(",") + " WHERE username = ?";
      queryParams.push(username); // Add username for WHERE clause

      // Execute the update query
      db.query(updateQuery, queryParams, (err, result) => {
        if (err) {
          console.error("Update error:", err);
          return res.json({
            success: false,
            message: "Failed to update profile",
          });
        }

        res.json({
          success: true,
          message: "Profile updated successfully",
        });
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating profile",
      });
    }
  }
);

app.get("/orders/create", (req, res) => {
  res.json({ message: "Orders API is working" });
});

app.post("/orders/create", async (req, res) => {
  try {
    console.log("Received order data:", JSON.stringify(req.body, null, 2));

    const { customer_id, vendor_id, total_price, status, items } = req.body;

    // Get customer ID
    const checkCustomerQuery =
      "SELECT customer_id FROM customers WHERE name = ?";

    db.query(
      checkCustomerQuery,
      [customer_id],
      (customerErr, customerResult) => {
        if (customerErr || customerResult.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Customer not found",
            error: customerErr ? customerErr.message : "No customer found",
          });
        }

        const actualCustomerId = customerResult[0].customer_id;

        // Get vendor ID
        const checkVendorQuery = "SELECT vendor_id FROM vendors WHERE name = ?";

        db.query(checkVendorQuery, [vendor_id], (vendorErr, vendorResult) => {
          if (vendorErr || vendorResult.length === 0) {
            return res.status(400).json({
              success: false,
              message: `Vendor not found: ${vendor_id}`,
            });
          }

          const actualVendorId = vendorResult[0].vendor_id;

          // Create the order
          const orderQuery =
            "INSERT INTO orders (customer_id, vendor_id, order_date, total_price, status) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)";

          db.query(
            orderQuery,
            [actualCustomerId, actualVendorId, total_price, status],
            (orderErr, orderResult) => {
              if (orderErr) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to create order",
                  error: orderErr.message,
                });
              }

              const order_id = orderResult.insertId;

              // Process each item
              const processItems = items.map((item) => {
                return new Promise((resolve, reject) => {
                  // Get the item from the items table using item_name and vendor
                  const itemQuery =
                    "SELECT item_id FROM items WHERE item_name = ? AND vendor_username = ?";
                  db.query(
                    itemQuery,
                    [item.item_name, item.vendor_username],
                    (itemErr, itemResult) => {
                      if (itemErr) {
                        console.error("Item query error:", itemErr);
                        reject(itemErr);
                        return;
                      }

                      if (itemResult.length === 0) {
                        console.error("Item not found:", item);
                        reject(new Error(`Item not found: ${item.item_name}`));
                        return;
                      }

                      const actualItemId = itemResult[0].item_id;

                      // Insert into order_items
                      const orderItemQuery =
                        "INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)";
                      db.query(
                        orderItemQuery,
                        [order_id, actualItemId, item.quantity, item.Price],
                        (orderItemErr) => {
                          if (orderItemErr) {
                            console.error(
                              "Order item insert error:",
                              orderItemErr
                            );
                            reject(orderItemErr);
                          } else {
                            resolve();
                          }
                        }
                      );
                    }
                  );
                });
              });

              Promise.all(processItems)
                .then(() => {
                  res.json({
                    success: true,
                    message: "Order created successfully",
                    order_id: order_id,
                  });
                })
                .catch((error) => {
                  console.error("Error processing items:", error);
                  res.status(500).json({
                    success: false,
                    message: "Failed to create order items",
                    error: error.message,
                  });
                });
            }
          );
        });
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
});

app.get("/orders/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log("Fetching orders for username:", username);

    // First get the customer_id from the customers table
    const customerQuery = "SELECT customer_id FROM customers WHERE name = ?";

    db.query(
      customerQuery,
      [username.trim()],
      (customerErr, customerResult) => {
        if (customerErr) {
          console.error("Error finding customer:", customerErr);
          return res.status(500).json({
            success: false,
            message: "Error finding customer",
          });
        }

        if (customerResult.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Customer not found",
          });
        }

        const customerId = customerResult[0].customer_id;
        console.log("Found customer_id:", customerId);

        // Get all orders with their items for this customer
        const ordersQuery = `
        SELECT 
          o.order_id,
          o.order_date,
          o.total_price,
          o.status,
          v.name as vendor_name,
          i.item_name,
          oi.quantity,
          oi.price as item_price
        FROM orders o
        JOIN vendors v ON o.vendor_id = v.vendor_id
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN items i ON oi.item_id = i.item_id
        WHERE o.customer_id = ?
        ORDER BY o.order_date DESC
      `;

        db.query(ordersQuery, [customerId], (err, results) => {
          if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({
              success: false,
              message: "Failed to fetch orders",
            });
          }

          // Group the results by order
          const orders = results.reduce((acc, row) => {
            const order = acc.find((o) => o.order_id === row.order_id);

            if (order) {
              // Add item to existing order
              order.items.push({
                item_name: row.item_name,
                quantity: row.quantity,
                price: row.item_price,
              });
            } else {
              // Create new order
              acc.push({
                order_id: row.order_id,
                order_date: row.order_date,
                total_price: row.total_price,
                status: row.status,
                vendor_name: row.vendor_name,
                items: [
                  {
                    item_name: row.item_name,
                    quantity: row.quantity,
                    price: row.item_price,
                  },
                ],
              });
            }
            return acc;
          }, []);

          console.log("Sending orders:", orders.length);
          res.json({
            success: true,
            orders: orders,
          });
        });
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

app.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    const searchQuery = `
      SELECT item_name, item_image, Price, vendor_username
      FROM items
      WHERE item_name LIKE ?
    `;

    db.query(searchQuery, [`%${query}%`], (err, results) => {
      if (err) {
        console.error("Search error:", err);
        return res.status(500).json({
          success: false,
          message: "Error searching items",
        });
      }

      try {
        // Convert binary image data to base64
        const itemsWithImages = results.map((item) => ({
          item_name: item.item_name,
          item_image: item.item_image
            ? `data:image/jpeg;base64,${item.item_image.toString("base64")}`
            : null,
          Price: item.Price,
          vendor_username: item.vendor_username,
        }));

        console.log(
          `Found ${itemsWithImages.length} items matching "${query}"`
        );

        res.json({
          success: true,
          items: itemsWithImages,
        });
      } catch (error) {
        console.error("Error processing images:", error);
        res.status(500).json({
          success: false,
          message: "Error processing images",
          error: error.message,
        });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching",
    });
  }
});

const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs").promises;
const sharp = require("sharp");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const API_URL = process.env.API_URL || "http://192.168.254.121:3000"; // Replace with your actual IP and port

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const app = express();
app.use(
  cors({
    origin: ["http://192.168.254.121:3000", "http://localhost:3000"],
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
  connectTimeout: 60000, // Increase timeout to 60 seconds
  maxPacketSize: 16777216, // Increase max packet size to 16MB
  typeCast: function (field, next) {
    if (field.type === "BLOB" || field.type === "MEDIUMBLOB") {
      return field.buffer();
    }
    return next();
  },
  multipleStatements: true,
});

// Reconnection handler
function handleDisconnect() {
  db.connect((err) => {
    if (err) {
      console.error("Error connecting to database:", err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  db.on("error", (err) => {
    console.error("Database error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

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
  const checkEmailQuery = "SELECT * FROM customers WHERE email = ?";

  db.query(checkEmailQuery, [email], async (err, results) => {
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

    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // If email exists, update the password
      const updateQuery = "UPDATE customers SET password = ? WHERE email = ?";

      db.query(updateQuery, [hashedPassword, email], (err, result) => {
        if (err) {
          console.error("Database error during password update:", err);
          return res.json({
            success: false,
            message: "Failed to update password",
            error: err.message,
          });
        }

        console.log("Password updated successfully for email:", email);
        res.json({
          success: true,
          message: "Password updated successfully",
        });
      });
    } catch (error) {
      console.error("Error hashing password:", error);
      res.status(500).json({
        success: false,
        message: "Server error processing request",
        error: error.message,
      });
    }
  });
});

// Add this status endpoint
app.get("/status", (req, res) => {
  res.json({ status: "Server is running" });
});

// Add this endpoint to get stores for student dashboard
app.get("/vendors", (req, res) => {
  console.log("Fetching vendors...");

  const query = `
    SELECT name, stall_name, profile_image 
    FROM vendors 
    WHERE Status = "Approved"
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.json({
        success: false,
        message: "Failed to fetch vendors",
        error: err.message,
      });
    }

    try {
      const vendorsWithImages = results.map((vendor) => ({
        name: vendor.name,
        Stall_name: vendor.stall_name,
        profile_image: vendor.profile_image
          ? `data:image/jpeg;base64,${vendor.profile_image.toString("base64")}`
          : null,
      }));

      console.log("Vendors fetched:", vendorsWithImages.length);

      res.json({
        success: true,
        stores: vendorsWithImages,
      });
    } catch (error) {
      console.error("Error processing vendor images:", error);
      res.json({
        success: false,
        message: "Error processing vendor images",
        error: error.message,
      });
    }
  });
});

// Add this endpoint to fetch products
// app.get("/items/:vendorUsername", (req, res) => {
//   const { vendorUsername } = req.params;
//   const { category } = req.query;

//   // Log the received parameters
//   console.log("Fetching items for:", { vendorUsername, category });

//   let query =
//     "SELECT item_name, item_image, Price, Category FROM items WHERE vendor_username = ?";
//   let queryParams = [vendorUsername];

//   if (category) {
//     // Use BINARY for exact case-sensitive matching
//     query += " AND BINARY Category = ?";
//     queryParams.push(category);
//   }

//   console.log("Executing query:", query, queryParams);

//   db.query(query, queryParams, (err, results) => {
//     if (err) {
//       console.error("Database error:", err);
//       return res.json({
//         success: false,
//         message: "Failed to fetch items",
//       });
//     }

//     try {
//       const itemsWithImages = results.map((item) => ({
//         ...item,
//         item_image: item.item_image
//           ? `data:image/jpeg;base64,${item.item_image.toString("base64")}`
//           : null,
//       }));

//       console.log(`Found ${itemsWithImages.length} items`);
//       console.log(
//         "Categories found:",
//         itemsWithImages.map((i) => i.Category)
//       );

//       res.json({
//         success: true,
//         products: itemsWithImages,
//       });
//     } catch (error) {
//       console.error("Error processing images:", error);
//       res.json({
//         success: false,
//         message: "Error processing images",
//         error: error.message,
//       });
//     }
//   });
// });

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
    item_name: req.body.item_name,
    price: req.body.price,
    description: req.body.description,
    category: req.body.category,
    vendor_username: req.body.vendor_username,
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

    const { item_name, price, description, category, vendor_username } =
      req.body;

    // Set default status as "Available"
    const status = "Available";

    const query = `
      INSERT INTO items (
        item_name, 
        price, 
        description, 
        category, 
        item_image, 
        status, 
        vendor_username
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [
        item_name,
        price,
        description,
        category,
        optimizedImageBuffer,
        status,
        vendor_username,
      ],
      (err, result) => {
        if (err) {
          console.error("Database error details:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to add item to database",
            error: err.message,
          });
        }

        console.log("Item added successfully, ID:", result.insertId);
        res.status(200).json({
          success: true,
          message: "Item added successfully",
          itemId: result.insertId,
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

app.post(
  "/customer/profile/update",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Received update request for:", username);
      console.log("Password received:", password ? "Yes" : "No");
      console.log("File received:", req.file ? "Yes" : "No");

      if (!password || password.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Password is required for profile update",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Password hashed successfully");

      // Prepare image data if provided
      let imageBuffer = null;
      if (req.file) {
        // Optimize image before saving
        imageBuffer = await sharp(req.file.buffer)
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      // Create a new connection for this operation
      const updateConnection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "evsu_canteen",
        connectTimeout: 60000,
        maxPacketSize: 16777216,
      });

      updateConnection.connect();

      let updateQuery = "UPDATE customers SET password = ?";
      let queryParams = [hashedPassword];

      if (imageBuffer) {
        updateQuery += ", profile_image = ?";
        queryParams.push(imageBuffer);
      }

      updateQuery += " WHERE name = ?";
      queryParams.push(username);

      console.log("Executing query:", updateQuery);
      console.log("Number of parameters:", queryParams.length);

      updateConnection.query(updateQuery, queryParams, (err, result) => {
        // Close the temporary connection
        updateConnection.end();

        if (err) {
          console.error("Update error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        console.log("Update successful. Rows affected:", result.affectedRows);
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
        error: error.message,
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

app.post("/login", async (req, res) => {
  console.log("Login attempt:", req.body);

  const { usernameOrEmail, password } = req.body;

  // Validation
  if (!usernameOrEmail || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  try {
    // Check in vendors table first
    const vendorQuery = `
      SELECT * FROM vendors 
      WHERE (email = ? OR name = ?) 
      AND password = ?
    `;

    db.query(
      vendorQuery,
      [usernameOrEmail, usernameOrEmail, password],
      (err, vendorResults) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        // If found in vendors
        if (vendorResults.length > 0) {
          const vendor = vendorResults[0];
          return res.json({
            success: true,
            message: "Login successful",
            userType: "Login",
            user: {
              id: vendor.id,
              name: vendor.name,
              email: vendor.email,
            },
          });
        }

        // If not found in vendors, check customers
        const customerQuery = `
        SELECT * FROM customers 
        WHERE (email = ? OR name = ?) 
        AND password = ?
      `;

        db.query(
          customerQuery,
          [usernameOrEmail, usernameOrEmail, password],
          (err, customerResults) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({
                success: false,
                message: "Database error",
              });
            }

            // If found in customers
            if (customerResults.length > 0) {
              const customer = customerResults[0];
              return res.json({
                success: true,
                message: "Login successful",
                userType: "Student",
                user: {
                  id: customer.id,
                  name: customer.name,
                  email: customer.email,
                },
              });
            }

            // If not found in either table
            return res.status(401).json({
              success: false,
              message: "Invalid username/email or password",
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.post("/signup", async (req, res) => {
  console.log("Received signup request"); // Debug log
  console.log("Request body:", req.body); // Debug log

  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log("Validation failed: Missing fields"); // Debug log
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if email exists
    console.log("Checking if email exists:", email); // Debug log
    const checkEmail = "SELECT * FROM vendors WHERE email = ?";

    db.query(checkEmail, [email], (err, results) => {
      if (err) {
        console.error("Database error during email check:", err); // Debug log
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (results.length > 0) {
        console.log("Email already exists"); // Debug log
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Insert new user
      console.log("Inserting new user"); // Debug log
      const insertQuery =
        "INSERT INTO vendors (name, email, password) VALUES (?, ?, ?)";

      db.query(insertQuery, [name, email, password], (err, results) => {
        if (err) {
          console.error("Database error during insert:", err); // Debug log
          return res.status(500).json({
            success: false,
            message: "Failed to create account",
          });
        }

        console.log("User created successfully"); // Debug log
        res.status(200).json({
          success: true,
          message: "Account created successfully",
        });
      });
    });
  } catch (error) {
    console.error("Server error:", error); // Debug log
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Vendor login endpoint with password hashing
app.post("/login_vendor", async (req, res) => {
  console.log("Login attempt:", req.body);

  const { usernameOrEmail, password } = req.body;

  // Validation
  if (!usernameOrEmail || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  try {
    // Check in vendors table first
    const vendorQuery = `
      SELECT * FROM vendors 
      WHERE (email = ? OR name = ?) 
      AND password = ?
    `;

    db.query(
      vendorQuery,
      [usernameOrEmail, usernameOrEmail, password],
      (err, vendorResults) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        // If found in vendors
        if (vendorResults.length > 0) {
          const vendor = vendorResults[0];
          return res.json({
            success: true,
            message: "Login successful",
            userType: "Login",
            user: {
              id: vendor.id,
              name: vendor.name,
              email: vendor.email,
            },
          });
        }

        // If not found in vendors, check customers
        const customerQuery = `
        SELECT * FROM customers 
        WHERE (email = ? OR name = ?) 
        AND password = ?
      `;

        db.query(
          customerQuery,
          [usernameOrEmail, usernameOrEmail, password],
          (err, customerResults) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({
                success: false,
                message: "Database error",
              });
            }

            // If found in customers
            if (customerResults.length > 0) {
              const customer = customerResults[0];
              return res.json({
                success: true,
                message: "Login successful",
                userType: "Student",
                user: {
                  id: customer.id,
                  name: customer.name,
                  email: customer.email,
                },
              });
            }

            // If not found in either table
            return res.status(401).json({
              success: false,
              message: "Invalid username/email or password",
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  next();
});

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Profile update endpoint
app.post(
  "/vendor_update_profile",
  upload.single("profile_image"),
  async (req, res) => {
    try {
      console.log("Received update request:", req.body);
      console.log("Received file:", req.file);

      const { name, email, oldPassword, newPassword } = req.body;
      const profileImage = req.file ? req.file.filename : null;

      // Check if vendor exists
      const checkQuery = "SELECT * FROM vendors WHERE email = ?";
      db.query(checkQuery, [email], async (checkErr, checkResults) => {
        if (checkErr || checkResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Vendor not found",
          });
        }

        // Build update query
        let updateFields = [];
        let values = [];

        if (name) {
          updateFields.push("name = ?");
          values.push(name);
        }
        if (profileImage) {
          updateFields.push("profile_image = ?");
          values.push(profileImage);
        }
        if (newPassword && oldPassword) {
          // Verify old password
          const passwordMatch = await bcrypt.compare(
            oldPassword,
            checkResults[0].password
          );
          if (!passwordMatch) {
            return res.status(401).json({
              success: false,
              message: "Current password is incorrect",
            });
          }
          // Hash new password
          const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
          updateFields.push("password = ?");
          values.push(hashedPassword);
        }

        if (updateFields.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No fields to update",
          });
        }

        // Add WHERE clause value
        values.push(email);

        const updateQuery = `UPDATE vendors SET ${updateFields.join(
          ", "
        )} WHERE email = ?`;

        // Execute update query
        db.query(updateQuery, values, (updateErr, updateResults) => {
          if (updateErr) {
            console.error("Database error:", updateErr);
            return res.status(500).json({
              success: false,
              message: "Database error occurred",
            });
          }

          // When sending successful response, include the full image URL
          return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
              name: name || checkResults[0].name,
              email,
              profileImage: profileImage
                ? `/uploads/${profileImage}`
                : checkResults[0].profile_image,
            },
          });
        });
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({
        success: false,
        message: "Server error occurred",
      });
    }
  }
);

// Serve static files
app.use("/uploads", express.static("uploads"));

// Vendor information endpoint
app.get("/vendor_information", (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  const query =
    "SELECT vendor_id, name, email, profile_image FROM vendors WHERE email = ?";
  db.query(query, [email], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    const vendor = results[0];
    res.json({
      success: true,
      vendor_id: vendor.vendor_id,
      name: vendor.name,
      email: vendor.email,
      profileImage: vendor.profile_image
        ? `/uploads/${vendor.profile_image}`
        : null,
    });
  });
});

app.post(
  "/vendor_update_profile",
  upload.single("profile_image"),
  async (req, res) => {
    try {
      console.log("Received update request:", req.body);
      console.log("Received file:", req.file);

      const { name, email, oldPassword, newPassword } = req.body;

      // First check if vendor exists
      const checkQuery = "SELECT * FROM vendors WHERE email = ?";
      db.query(checkQuery, [email], async (checkErr, checkResults) => {
        if (checkErr || checkResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Vendor not found",
          });
        }

        // Build update query
        let updateFields = [];
        let values = [];

        if (name) {
          updateFields.push("name = ?");
          values.push(name);
        }

        if (req.file) {
          updateFields.push("profile_image = ?");
          values.push(req.file.filename);
        }

        if (newPassword && oldPassword) {
          // Verify old password
          const passwordMatch = await bcrypt.compare(
            oldPassword,
            checkResults[0].password
          );
          if (!passwordMatch) {
            return res.status(401).json({
              success: false,
              message: "Current password is incorrect",
            });
          }
          // Hash new password
          const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
          updateFields.push("password = ?");
          values.push(hashedPassword);
        }

        if (updateFields.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No fields to update",
          });
        }

        // Add WHERE clause value
        values.push(email);

        const updateQuery = `UPDATE vendors SET ${updateFields.join(
          ", "
        )} WHERE email = ?`;

        db.query(updateQuery, values, (updateErr, updateResults) => {
          if (updateErr) {
            console.error("Update error:", updateErr);
            return res.status(500).json({
              success: false,
              message: "Failed to update profile",
            });
          }

          res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
              name: name || checkResults[0].name,
              email,
              profileImage: req.file
                ? `/uploads/${req.file.filename}`
                : checkResults[0].profile_image,
            },
          });
        });
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({
        success: false,
        message: "Server error occurred",
      });
    }
  }
);

app.get("/customer", (req, res) => {
  const { username } = req.query;
  const query = "SELECT customer_id FROM customers WHERE name = ?";

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, customer_id: results[0].customer_id });
  });
});

// Endpoint to get item_id and vendor_id by item_name
app.get("/item", (req, res) => {
  const { item_name } = req.query;
  const query = `
    SELECT i.item_id, v.vendor_id 
    FROM items i
    JOIN vendors v ON i.vendor_username = v.name
    WHERE i.item_name = ?
  `;

  db.query(query, [item_name], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({
      success: true,
      item_id: results[0].item_id,
      vendor_id: results[0].vendor_id,
    });
  });
});

app.post("/favorites/create", async (req, res) => {
  try {
    console.log("Received favorite data:", JSON.stringify(req.body, null, 2));

    const { customer_id, vendor_username, item_name, Price } = req.body;

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

        db.query(
          checkVendorQuery,
          [vendor_username],
          (vendorErr, vendorResult) => {
            if (vendorErr || vendorResult.length === 0) {
              return res.status(400).json({
                success: false,
                message: `Vendor not found: ${vendor_username}`,
              });
            }

            const actualVendorId = vendorResult[0].vendor_id;

            // Get item ID
            const itemQuery =
              "SELECT item_id FROM items WHERE item_name = ? AND vendor_username = ?";

            db.query(
              itemQuery,
              [item_name, vendor_username],
              (itemErr, itemResult) => {
                if (itemErr || itemResult.length === 0) {
                  return res.status(400).json({
                    success: false,
                    message: `Item not found: ${item_name}`,
                  });
                }

                const actualItemId = itemResult[0].item_id;

                // Check if item is already in favorites
                const checkFavoriteQuery =
                  "SELECT * FROM favorites WHERE customer_id = ? AND item_id = ? AND vendor_id = ?";

                db.query(
                  checkFavoriteQuery,
                  [actualCustomerId, actualItemId, actualVendorId],
                  (favoriteCheckErr, favoriteCheckResult) => {
                    if (favoriteCheckErr) {
                      return res.status(500).json({
                        success: false,
                        message: "Error checking favorites",
                        error: favoriteCheckErr.message,
                      });
                    }

                    // If item is already in favorites
                    if (favoriteCheckResult.length > 0) {
                      return res.status(400).json({
                        success: false,
                        message: "Item is already in favorites",
                      });
                    }

                    // If not in favorites, proceed to insert
                    const favoriteQuery =
                      "INSERT INTO favorites (customer_id, item_id, vendor_id, Price) VALUES (?, ?, ?, ?)";

                    db.query(
                      favoriteQuery,
                      [actualCustomerId, actualItemId, actualVendorId, Price],
                      (favoriteErr) => {
                        if (favoriteErr) {
                          return res.status(500).json({
                            success: false,
                            message: "Failed to add favorite",
                            error: favoriteErr.message,
                          });
                        }

                        res.json({
                          success: true,
                          message: "Favorite added successfully",
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add favorite",
      error: error.message,
    });
  }
});

app.get("/favorites/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Items per page
    const offset = (page - 1) * limit;

    console.log("Fetching favorites for username:", username);

    // First get the customer_id
    const customerQuery = "SELECT customer_id FROM customers WHERE name = ?";

    db.query(customerQuery, [username], (customerErr, customerResult) => {
      if (customerErr || customerResult.length === 0) {
        return res.json({
          success: false,
          message: "Customer not found",
        });
      }

      const customerId = customerResult[0].customer_id;

      // Get total count of favorites
      const countQuery = `
        SELECT COUNT(*) as total
        FROM favorites f
        WHERE f.customer_id = ?
      `;

      db.query(countQuery, [customerId], (countErr, countResult) => {
        if (countErr) {
          return res.json({
            success: false,
            message: "Failed to count favorites",
          });
        }

        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Updated query to join with vendors table and get vendor_username with pagination
        const favoritesQuery = `
          SELECT 
            f.favorite_id,
            i.item_id,
            i.item_name,
            i.Price,
            i.Category,
            i.item_image,
            v.username as vendor_username
          FROM favorites f
          JOIN items i ON f.item_id = i.item_id
          JOIN vendors v ON i.vendor_username = v.username
          WHERE f.customer_id = ?
          LIMIT ? OFFSET ?
        `;

        db.query(
          favoritesQuery,
          [customerId, limit, offset],
          (err, results) => {
            if (err) {
              console.error("Database error:", err);
              return res.json({
                success: false,
                message: "Failed to fetch favorites",
                error: err.message,
              });
            }

            try {
              const favoritesWithImages = results.map((item) => ({
                favorite_id: item.favorite_id,
                item_id: item.item_id,
                item_name: item.item_name,
                Price: item.Price,
                Category: item.Category,
                vendor_username: item.vendor_username,
                item_image: item.item_image
                  ? `data:image/jpeg;base64,${item.item_image.toString(
                      "base64"
                    )}`
                  : null,
              }));

              res.json({
                success: true,
                favorites: favoritesWithImages,
                pagination: {
                  currentPage: page,
                  totalPages: totalPages,
                  totalItems: totalItems,
                  hasMore: page < totalPages,
                },
              });
            } catch (error) {
              console.error("Error processing images:", error);
              res.json({
                success: false,
                message: "Error processing images",
                error: error.message,
              });
            }
          }
        );
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
      error: error.message,
    });
  }
});

// Update the endpoint for fetching store items
app.get("/items/:storeName", (req, res) => {
  const { storeName } = req.params;
  console.log("Fetching items for store:", storeName);

  const query = `
    SELECT 
      i.item_id,
      i.item_name,
      i.item_image,
      i.Price,
      i.Category,
      i.vendor_username,
      v.username as vendor_username
    FROM items i
    JOIN vendors v ON i.vendor_username = v.username
    WHERE v.username = ?
  `;

  db.query(query, [storeName], (err, results) => {
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
        item_id: item.item_id,
        item_name: item.item_name,
        item_image: item.item_image
          ? `data:image/jpeg;base64,${item.item_image.toString("base64")}`
          : null,
        Price: item.Price,
        vendor_username: item.vendor_username,
        Category: item.Category,
      }));

      console.log("Items fetched successfully, count:", itemsWithImages.length);

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

// Add cancel order endpoint
app.put("/orders/cancel/:orderId", async (req, res) => {
  const { orderId } = req.params;

  const checkStatusQuery = "SELECT status FROM orders WHERE order_id = ?";
  const updateStatusQuery =
    "UPDATE orders SET status = 'cancelled' WHERE order_id = ? AND status = 'pending'";

  try {
    // First check the current status
    db.query(checkStatusQuery, [orderId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking order status:", checkErr);
        return res.json({
          success: false,
          message: "Failed to check order status",
          error: checkErr.message,
        });
      }

      if (checkResults.length === 0) {
        return res.json({
          success: false,
          message: "Order not found",
        });
      }

      const currentStatus = checkResults[0].status;

      if (currentStatus.toLowerCase() !== "pending") {
        return res.json({
          success: false,
          message: "Only pending orders can be cancelled",
        });
      }

      // If status is pending, proceed with cancellation
      db.query(updateStatusQuery, [orderId], (updateErr, updateResults) => {
        if (updateErr) {
          console.error("Error cancelling order:", updateErr);
          return res.json({
            success: false,
            message: "Failed to cancel order",
            error: updateErr.message,
          });
        }

        if (updateResults.affectedRows > 0) {
          res.json({
            success: true,
            message: "Order cancelled successfully",
          });
        } else {
          res.json({
            success: false,
            message: "Failed to cancel order",
          });
        }
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling order",
      error: error.message,
    });
  }
});

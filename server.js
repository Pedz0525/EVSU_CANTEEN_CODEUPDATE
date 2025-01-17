const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs").promises;
const bcrypt = require("bcrypt");
const saltRounds = 10;
const sharp = require('sharp');

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
    origin: ["http://192.168.25.121:3000", "http://localhost:3000"],
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
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "evsu_canteen",
  connectionLimit: 10,
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Successfully connected to database");
  connection.release();
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
// Update the signup endpoint
// Update the signup endpoint
app.post("/signup", upload.single("profile_image"), async (req, res) => {
  try {
    console.log("Received signup request:", {
      body: req.body,
      file: req.file ? "File received" : "No file"
    });

    const { name, username, email, password } = req.body;

    // Validate required fields
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if username or email already exists
    const checkExisting = "SELECT * FROM customers WHERE username = ? OR email = ?";
    db.query(checkExisting, [username, email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username or email already exists"
        });
      }

      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Process profile image if exists
        let profileImageBuffer = null;
        if (req.file) {
          try {
            profileImageBuffer = await sharp(req.file.buffer)
              .resize(800, 800, { fit: 'inside' })
              .jpeg({ quality: 80 })
              .toBuffer();
          } catch (imageError) {
            console.error("Image processing error:", imageError);
            return res.status(500).json({
              success: false,
              message: "Error processing image"
            });
          }
        }

        // Insert new user
        const insertUser = `
          INSERT INTO customers 
          (name, username, email, password, profile_image) 
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          insertUser,
          [name, username, email, hashedPassword, profileImageBuffer],
          (insertErr, result) => {
            if (insertErr) {
              console.error("Insert error:", insertErr);
              return res.status(500).json({
                success: false,
                message: "Error creating account",
                error: insertErr.message
              });
            }

            console.log("Account created successfully");
            res.json({
              success: true,
              message: "Account created successfully"
            });
          }
        );
      } catch (hashError) {
        console.error("Password hashing error:", hashError);
        return res.status(500).json({
          success: false,
          message: "Error processing password"
        });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
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

app.get("/items", (req, res) => {
  const query = `
    SELECT 
      i.item_id,
      i.item_name,
      i.item_image,
      i.Price,
      i.Category,
      i.status,
      v.vendor_id,  -- Fetch vendor_id from the vendors table
      v.stall_name  -- Fetch stall_name for display purposes
    FROM items i
    JOIN vendors v ON i.vendor_id = v.vendor_id  -- Join with vendors table
    WHERE i.status != 'Unavailable'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch items",
        error: err.message,
      });
    }

    try {
      const itemsWithImages = results.map((item) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        Price: item.Price,
        Category: item.Category,
        vendor_id: item.vendor_id, // Use vendor_id
        stall_name: item.stall_name, // For display
        status: item.status,
        item_image: item.item_image
          ? `data:image/jpeg;base64,${item.item_image.toString("base64")}`
          : null,
      }));

      console.log(
        "Items fetched with status:",
        itemsWithImages.map((item) => ({
          name: item.item_name,
          status: item.status,
        }))
      );

      res.json({
        success: true,
        products: itemsWithImages,
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
});

// Update the categories endpoint
app.get("/categories/:storeName", (req, res) => {
  const { storeName } = req.params;
  const { category } = req.query;

  console.log("Request received with:", {
    storeName: storeName,
    category: category,
  });

  // First, get the vendor_id using stall_name
  const vendorQuery = `
    SELECT vendor_id, stall_name 
    FROM vendors 
    WHERE LOWER(stall_name) = LOWER(?)
  `;

  console.log("Looking up vendor with stall_name:", storeName);

  db.query(vendorQuery, [storeName], (vendorErr, vendorResults) => {
    if (vendorErr) {
      console.error("Vendor lookup error:", vendorErr);
      return res.json({
        success: false,
        message: `Database error looking up vendor: ${vendorErr.message}`,
      });
    }

    if (vendorResults.length === 0) {
      console.error("No vendor found for stall_name:", storeName);
      return res.json({
        success: false,
        message: `No vendor found with stall name: ${storeName}`,
      });
    }

    const vendorId = vendorResults[0].vendor_id;
    console.log("Found vendor_id:", vendorId);

    const query = `
      SELECT 
        i.item_id,
        i.item_name, 
        i.item_image, 
        i.Price, 
        i.Category, 
        i.status,
        v.vendor_id,
        v.stall_name
      FROM items i
      JOIN vendors v ON i.vendor_id = v.vendor_id
      WHERE i.vendor_id = ?
      AND LOWER(i.Category) = LOWER(?)
      AND i.status != 'Unavailable'
    `;

    console.log("Executing items query with params:", [vendorId, category]);

    db.query(query, [vendorId, category], (err, results) => {
      if (err) {
        console.error("Database error fetching items:", err);
        return res.json({
          success: false,
          message: "Failed to fetch category items",
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
          Category: item.Category,
          vendor_id: item.vendor_id,
          stall_name: item.stall_name,
          status: item.status,
        }));

        console.log(
          `Found ${itemsWithImages.length} items for vendor_id ${vendorId} in category ${category}`
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

// app.post(
//   "/customer/profile/update",
//   upload.single("profileImage"),
//   async (req, res) => {
//     try {
//       const { username, password } = req.body;
//       console.log("Received update request for:", username);
//       console.log("Password received:", password ? "Yes" : "No");
//       console.log("File received:", req.file ? "Yes" : "No");

//       if (!password || password.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Password is required for profile update",
//         });
//       }

//       // Hash the password
//       const hashedPassword = await bcrypt.hash(password, 10);
//       console.log("Password hashed successfully");

//       // Prepare image data if provided
//       let imageBuffer = null;
//       if (req.file) {
//         // Optimize image before saving
//         imageBuffer = await sharp(req.file.buffer)
//           .resize(800, 800, { fit: "inside", withoutEnlargement: true })
//           .jpeg({ quality: 80 })
//           .toBuffer();
//       }

//       // Create a new connection for this operation
//       const updateConnection = mysql.createConnection({
//         host: "localhost",
//         user: "root",
//         password: "",
//         database: "evsu_canteen",
//         connectTimeout: 60000,
//         maxPacketSize: 16777216,
//       });

//       updateConnection.connect();

//       let updateQuery = "UPDATE customers SET password = ?";
//       let queryParams = [hashedPassword];

//       if (imageBuffer) {
//         updateQuery += ", profile_image = ?";
//         queryParams.push(imageBuffer);
//       }

//       updateQuery += " WHERE name = ?";
//       queryParams.push(username);

//       console.log("Executing query:", updateQuery);
//       console.log("Number of parameters:", queryParams.length);

//       updateConnection.query(updateQuery, queryParams, (err, result) => {
//         // Close the temporary connection
//         updateConnection.end();

//         if (err) {
//           console.error("Update error:", err);
//           return res.status(500).json({
//             success: false,
//             message: "Failed to update profile",
//             error: err.message,
//           });
//         }

//         if (result.affectedRows === 0) {
//           return res.status(404).json({
//             success: false,
//             message: "User not found",
//           });
//         }

//         console.log("Update successful. Rows affected:", result.affectedRows);
//         res.json({
//           success: true,
//           message: "Profile updated successfully",
//         });
//       });
//     } catch (error) {
//       console.error("Server error:", error);
//       res.status(500).json({
//         success: false,
//         message: "Server error while updating profile",
//         error: error.message,
//       });
//     }
//   }
// );

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

        // Verify vendor ID directly
        const checkVendorQuery =
          "SELECT vendor_id FROM vendors WHERE vendor_id = ?";

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
                  // Get the item from the items table using item_name and vendor_id
                  const itemQuery =
                    "SELECT item_id FROM items WHERE item_name = ? AND vendor_id = ?";
                  db.query(
                    itemQuery,
                    [item.item_name, item.vendor_id], // Use vendor_id
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

app.get("/search", (req, res) => {
  const query = req.query.query;
  
  const searchQuery = `
    SELECT 
      i.item_id,
      i.item_name,
      i.item_image,
      i.Price,
      i.Category,
      i.status,
      v.vendor_id,
      v.stall_name  -- Include stall_name in the selection
    FROM items i
    JOIN vendors v ON i.vendor_id = v.vendor_id  -- Join with vendors table
    WHERE i.item_name LIKE ? AND i.status != 'Unavailable'
  `;

  db.query(searchQuery, [`%${query}%`], (err, results) => {
    if (err) {
      console.error("Search error:", err);
      return res.status(500).json({
        success: false,
        message: "Error performing search",
        error: err.message
      });
    }

    try {
      const itemsWithImages = results.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        Price: item.Price,
        Category: item.Category,
        vendor_id: item.vendor_id,
        stall_name: item.stall_name, // Include stall_name in the response
        status: item.status,
        item_image: item.item_image 
          ? `data:image/jpeg;base64,${item.item_image.toString('base64')}` 
          : null
      }));

      res.json({
        success: true,
        items: itemsWithImages
      });
    } catch (error) {
      console.error("Error processing search results:", error);
      res.status(500).json({
        success: false,
        message: "Error processing search results",
        error: error.message
      });
    }
  });
});

// Vendor login endpoint with password hashing

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  next();
});

// Configure multer for image upload
// Remove the Sharp import if it exists

// Modify the multer configuration to store files directly
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});



// Profile update endpoint

// Serve static files
app.use("/uploads", express.static("uploads"));

// Vendor information endpoint

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

    const { customer_id, vendor_id, item_name } = req.body;

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

        // Verify vendor ID directly
        const checkVendorQuery =
          "SELECT vendor_id FROM vendors WHERE vendor_id = ?";

        db.query(checkVendorQuery, [vendor_id], (vendorErr, vendorResult) => {
          if (vendorErr || vendorResult.length === 0) {
            return res.status(400).json({
              success: false,
              message: `Vendor not found: ${vendor_id}`,
            });
          }

          const actualVendorId = vendorResult[0].vendor_id;

          // Get item ID
          const itemQuery =
            "SELECT item_id FROM items WHERE item_name = ? AND vendor_id = ?";

          db.query(
            itemQuery,
            [item_name, vendor_id], // Use vendor_id
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
                    "INSERT INTO favorites (customer_id, item_id, vendor_id) VALUES (?, ?, ?)";

                  db.query(
                    favoriteQuery,
                    [actualCustomerId, actualItemId, actualVendorId],
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
        });
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

// Update the favorites endpoint
app.get("/favorites/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log("Fetching favorites for username:", username);

    const customerQuery = "SELECT customer_id FROM customers WHERE name = ?";

    db.query(customerQuery, [username], (customerErr, customerResult) => {
      if (customerErr || customerResult.length === 0) {
        return res.json({
          success: false,
          message: "Customer not found",
        });
      }

      const customerId = customerResult[0].customer_id;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM favorites f
        JOIN items i ON f.item_id = i.item_id
        WHERE f.customer_id = ? 
        AND i.status != 'Unavailable'
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

        const favoritesQuery = `
          SELECT 
            f.favorite_item_id,
            i.item_id,
            i.item_name,
            i.Price,
            i.Category,
            i.item_image,
            i.status,
            v.vendor_id,
            v.stall_name  -- Added stall_name to the query
          FROM favorites f
          JOIN items i ON f.item_id = i.item_id
          JOIN vendors v ON f.vendor_id = v.vendor_id
          WHERE f.customer_id = ?
          AND i.status != 'Unavailable'
          ORDER BY 
            CASE 
              WHEN i.status = 'Available' THEN 1
              WHEN i.status = 'Out of Stock' THEN 2
            END
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
                favorite_item_id: item.favorite_item_id,
                item_id: item.item_id,
                item_name: item.item_name,
                Price: item.Price,
                Category: item.Category,
                vendor_id: item.vendor_id,
                stall_name: item.stall_name,
                status: item.status,
                item_image: item.item_image
                  ? `data:image/jpeg;base64,${item.item_image.toString(
                      "base64"
                    )}`
                  : null,
              }));

              console.log(
                "Favorites with status:",
                favoritesWithImages.map((item) => ({
                  name: item.item_name,
                  status: item.status,
                }))
              );

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

  const query = `
    SELECT 
      i.item_id,
      i.item_name,
      i.item_image,
      i.Price,
      i.Category,
      i.status,
      v.vendor_id,  -- Fetch vendor_id from the vendors table
      v.stall_name  -- Fetch stall_name for display purposes
    FROM items i
    JOIN vendors v ON i.vendor_id = v.vendor_id  -- Join with vendors table
    WHERE v.name = ? 
    AND i.status != 'Unavailable'
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
        Price: item.Price,
        Category: item.Category,
        vendor_id: item.vendor_id, // Use vendor_id
        stall_name: item.stall_name, // For display
        status: item.status,
        item_image: item.item_image
          ? `data:image/jpeg;base64,${item.item_image.toString("base64")}`
          : null,
      }));

      console.log(
        "Items fetched with status:",
        itemsWithImages.map((item) => ({
          name: item.item_name,
          status: item.status,
        }))
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

// Delete favorite endpoint
app.delete("/favorites/:favoriteItemId", async (req, res) => {
  try {
    const { favoriteItemId } = req.params;
    console.log("Attempting to delete favorite item:", favoriteItemId);

    const deleteQuery = "DELETE FROM favorites WHERE favorite_item_id = ?";

    db.query(deleteQuery, [favoriteItemId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to remove favorite",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Favorite item not found",
        });
      }

      console.log("Favorite removed successfully");
      res.json({
        success: true,
        message: "Favorite removed successfully",
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing favorite",
      error: error.message,
    });
  }
});

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
      WHERE email = ? OR name = ?
    `;

    db.query(
      vendorQuery,
      [usernameOrEmail, usernameOrEmail],
      async (err, vendorResults) => {
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

          // Compare hashed password
          const match = await bcrypt.compare(password, vendor.password);
          if (match) {
            return res.json({
              success: true,
              message: "Login successful",
              userType: "Vendor",
              user: {
                id: vendor.id,
                name: vendor.name,
                email: vendor.email,
                vendor_id: vendor.vendor_id,
              },
            });
          } else {
            return res.status(401).json({
              success: false,
              message: "Invalid username/email or password",
            });
          }
        }

        // If not found in vendors, check customers
        const customerQuery = `
        SELECT * FROM customers 
        WHERE email = ? OR name = ?
      `;

        db.query(
          customerQuery,
          [usernameOrEmail, usernameOrEmail],
          async (err, customerResults) => {
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

              // Compare hashed password
              const match = await bcrypt.compare(password, customer.password);
              if (match) {
                return res.json({
                  success: true,
                  message: "Login successful",
                  userType: "Customer",
                  user: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                  },
                });
              } else {
                return res.status(401).json({
                  success: false,
                  message: "Invalid username/email or password",
                });
              }
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

// Profile update endpoint

app.post(
  "/vendor_update_profile",
  upload.single("profile_image"),
  async (req, res) => {
    try {
      console.log("Received update request:", req.body);
      console.log("Received file:", req.file);

      const { name, email, oldPassword, newPassword, stallname, username } =
        req.body;
      const profileImage = req.file ? req.file.filename : null;

      // Validate input
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required to update the profile",
        });
      }

      // Verify old password if updating the password
      if (oldPassword && newPassword) {
        const getPasswordQuery = "SELECT password FROM vendors WHERE email = ?";
        const [rows] = await db.promise().query(getPasswordQuery, [email]);

        if (rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Vendor not found",
          });
        }

        const isPasswordMatch = await bcrypt.compare(
          oldPassword,
          rows[0].password
        );
        if (!isPasswordMatch) {
          return res.status(401).json({
            success: false,
            message: "Old password is incorrect",
          });
        }
      }

      // Build update query
      let query = "UPDATE vendors SET ";
      const updateFields = [];
      const values = [];

      if (name) {
        updateFields.push("name = ?");
        values.push(name);
      }
      if (email) {
        updateFields.push("email = ?");
        values.push(email);
      }
      if (profileImage) {
        updateFields.push("profile_image = ?");
        values.push(profileImage);
      }
      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 8);
        updateFields.push("password = ?");
        values.push(hashedPassword);
      }
      if (stallname) {
        updateFields.push("stall_name = ?");
        values.push(stallname);
      }
      if (username) {
        updateFields.push("username = ?");
        values.push(username);
      }

      // Ensure there are fields to update
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      // Add the condition for the WHERE clause
      values.push(email); // Assuming email is used to find the user
      query += updateFields.join(", ") + " WHERE email = ?";

      // Execute the update query
      db.query(query, values, (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({
            success: false,
            message: "Database error occurred",
          });
        }

        // Send successful response
        return res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          data: {
            name: name || null,
            email,
            username: username || null,
            stallname: stallname || null,
            profileImage: profileImage ? `uploads/${profileImage}` : null,
          },
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

app.use("/uploads_vendor", express.static("uploads"));

app.post("/logout_vendor", async (req, res) => {
  try {
    // Get the token from headers
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      // Add token to blacklist or invalidate it
      // This depends on your authentication implementation
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
});

app.get("/vendor_information", (req, res) => {
  const email = req.query.email; // Get the email from the query parameters

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  const query = "SELECT * FROM vendors WHERE email = ?";
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
      username: vendor.username,
      stallname: vendor.stall_name,
      profileImage: vendor.profile_image
        ? `/uploads/${vendor.profile_image}`
        : null,
    });
  });
});
const storage1 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "item-image-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload1 = multer({ storage: storage1 });
app.post("/add_item", upload1.single("image"), (req, res) => {
  const { name, description, category, status, price, vendor_id } = req.body;
  const image = req.file ? req.file.filename : null; // Get the uploaded image filename

  // Validate input
  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Item name is required" });
  }
  if (!description) {
    return res
      .status(400)
      .json({ success: false, message: "Item description is required" });
  }
  if (!price) {
    return res
      .status(400)
      .json({ success: false, message: "Item price is required" });
  }
  if (isNaN(price) || price <= 0) {
    return res.status(400).json({
      success: false,
      message: "Item price must be a positive number",
    });
  }

  // Convert price to a decimal
  const decimalPrice = parseFloat(price).toFixed(2); // Ensures the price has two decimal places

  // Proceed to insert the item
  const query =
    "INSERT INTO items (item_name, description, category, status, price, vendor_id, item_image) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [name, description, category, status, decimalPrice, vendor_id, image],
    (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res
          .status(500)
          .json({ success: false, message: "Database error occurred" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Item added successfully" });
    }
  );
});

app.get("/vendor_items", (req, res) => {
  const vendor_id = req.query.vendor_id; // Get the vendor_id from the query parameters

  if (!vendor_id) {
    return res
      .status(400)
      .json({ success: false, message: "vendor_id is required" });
  }

  const query = "SELECT * FROM items WHERE vendor_id = ?";
  db.query(query, [vendor_id], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No items found for the given vendor ID",
      });
    }

    // Map results to return all items, including the item image as a URL if available
    const items = results.map((item) => ({
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
      description: item.description,
      status: item.status,
      category: item.category,
      item_image: item.item_image ? `/uploads/${item.item_image}` : null, // Adjust this based on where your images are stored
    }));

    res.json({
      success: true,
      items, // Return all items, not just the first one
    });
  });
});

app.put("/update_item", upload.single("image"), (req, res) => {
  const { id, name, description, price, category, status } = req.body;
  const image = req.file ? req.file.filename : null;

  const updateQuery =
    "UPDATE items SET item_name = ?, description = ?, price = ?, category = ?, status = ?, item_image = ? WHERE item_id = ?";

  db.query(
    updateQuery,
    [name, description, price, category, status, image, id],
    (err, result) => {
      if (err) {
        console.error("Error updating item:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error updating item" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Item updated successfully" });
    }
  );
});

app.delete("/delete_item", (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Item ID is required" });
  }

  const deleteQuery = "DELETE FROM items WHERE item_id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting item:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error deleting item" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Item deleted successfully" });
  });
});

app.get("/orders", (req, res) => {
  const vendorId = req.query.vendor_id; // Retrieve vendor_id from query params

  if (!vendorId) {
    return res.status(400).json({ error: "vendor_id is required" });
  }

  const query = `
    SELECT 
    o.order_id,
    c.name,
    o.order_date,
    o.total_price,
    o.status,
    oi.item_id,
    i.item_name,
    oi.quantity,
    oi.price AS item_price
    FROM 
        orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    INNER JOIN order_items oi ON o.order_id = oi.order_id
    INNER JOIN items i ON oi.item_id = i.item_id
    WHERE o.vendor_id = ?;
  `;

  db.query(query, [vendorId], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Return the data as a JSON response
    res.json(results);
  });
});

app.get("/numberOfOrders", (req, res) => {
  // Ensure that the vendor_id is passed in the query string
  const { vendor_id } = req.query;

  if (!vendor_id) {
    return res.status(400).send("Vendor ID is required");
  }

  // Define the query with a placeholder for vendor_id
  const query = `
    SELECT COUNT(*) AS order_count
    FROM orders
    WHERE vendor_id = ?;
  `;

  // Execute the query with vendor_id as a parameter
  db.query(query, [vendor_id], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res
        .status(500)
        .send("An error occurred while retrieving the data.");
    } else {
      // Respond with the count of orders
      const orderCount = results[0] ? results[0].order_count : 0;
      res.json({ number_of_orders: orderCount });
    }
  });
});

app.post("/update-order-status", (req, res) => {
  const { order_id, status } = req.body;

  const query = "UPDATE orders SET status = ? WHERE order_id = ?";

  db.query(query, [status, order_id], (err, result) => {
    if (err) {
      res.status(500).send({ message: "Error updating status", error: err });
    } else {
      res.status(200).send({ message: "Status updated successfully" });
    }
  });
});
app.get("/total-sales", (req, res) => {
  const query = `
    SELECT SUM(total_price) AS total_paid_amount 
    FROM orders 
    WHERE status = 'Confirmed';
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error executing query");
    } else {
      res.json({ totalSales: results[0].total_paid_amount });
    }
  });
});

app.get("/lost-sales", (req, res) => {
  const query = `
    SELECT SUM(total_price) AS total_paid_amount 
    FROM orders 
    WHERE status = 'Cancelled';
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error executing query");
    } else {
      res.json({ totalSales: results[0].total_paid_amount });
    }
  });
});

app.post("/vendor-signup", upload.single("profile_image"), async (req, res) => {
  const { name, username, email, password, stall_name } = req.body;
  const profileImage = req.file ? req.file.path : null; // Access the uploaded image

  // Validate input data
  if (!name || !username || !email || !password || !stall_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 8);

  // Insert user into the database, including the image file path
  try {
    const result = await db.query(
      "INSERT INTO vendors (name, username, email, password, stall_name, profile_image) VALUES (?, ?, ?, ?, ?, ?)",
      [name, username, email, hashedPassword, stall_name, profileImage]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update Name
app.post("/customer/profile/update-name", async (req, res) => {
  try {
    const { username, name } = req.body;
    console.log("Received name update request for:", username);

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    const updateQuery = "UPDATE customers SET name = ? WHERE username = ?";
    
    db.query(updateQuery, [name, username], (err, result) => {
      if (err) {
        console.error("Name update error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update name",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.log("Name update successful for:", username);
      res.json({
        success: true,
        message: "Name updated successfully",
      });
    });
  } catch (error) {
    console.error("Server error during name update:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating name",
    });
  }
});

// Update Password
app.post("/customer/profile/update-password", express.json(), async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Received password update request for:", username);

    if (!password || password.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Password cannot be empty"
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    const updateQuery = "UPDATE customers SET password = ? WHERE name = ?";
    
    db.query(updateQuery, [hashedPassword, username], (err, result) => {
      if (err) {
        console.error("Password update error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update password",
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      console.log("Password updated successfully for:", username);
      res.json({
        success: true,
        message: "Password updated successfully"
      });
    });
  } catch (error) {
    console.error("Server error during password update:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating password"
    });
  }
});

// Update Profile Photo
app.post("/customer/profile/update-photo", upload.single("profileImage"), async (req, res) => {
  try {
    const { username } = req.body;
    console.log("Received photo update request for:", username);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    // Process image with sharp
    let imageBuffer;
    try {
      imageBuffer = await sharp(req.file.buffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (sharpError) {
      console.error("Image processing error:", sharpError);
      return res.status(500).json({
        success: false,
        message: "Error processing image"
      });
    }

    // Update the profile image in database
    const updateQuery = "UPDATE customers SET profile_image = ? WHERE name = ?";
    
    db.query(updateQuery, [imageBuffer, username], (err, result) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update profile image"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      console.log("Profile image updated successfully for:", username);
      res.json({
        success: true,
        message: "Profile image updated successfully"
      });
    });

  } catch (error) {
    console.error("Server error during photo update:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile photo"
    });
  }
});

// Get Profile Information
app.get("/customer/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log("Fetching profile for:", username);

    const query = "SELECT username, name, profile_image FROM customers WHERE username = ?";
    
    db.query(query, [username], (err, results) => {
      if (err) {
        console.error("Profile fetch error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch profile",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const profile = results[0];
      res.json({
        success: true,
        username: profile.username,
        name: profile.name,
        profile_image: profile.profile_image 
          ? `data:image/jpeg;base64,${profile.profile_image.toString('base64')}`
          : null,
      });
    });
  } catch (error) {
    console.error("Server error during profile fetch:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
});

// Update Username (if needed)
app.post("/customer/profile/update-username", express.json(), async (req, res) => {
  try {
    const { currentUsername, newUsername } = req.body;
    console.log("Username update request:", { currentUsername, newUsername });

    if (!currentUsername || !newUsername) {
      return res.status(400).json({
        success: false,
        message: "Current and new username are required"
      });
    }

    if (newUsername.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "New username cannot be empty"
      });
    }

    // First check if new username already exists
    const checkQuery = "SELECT username FROM customers WHERE username = ?";
    db.query(checkQuery, [newUsername], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Username check error:", checkErr);
        return res.status(500).json({
          success: false,
          message: "Error checking username availability"
        });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username already taken"
        });
      }

      // If username is available, proceed with update
      // Changed the query to use name instead of username
      const updateQuery = "UPDATE customers SET username = ? WHERE name = ?";
      db.query(updateQuery, [newUsername, currentUsername], (updateErr, result) => {
        if (updateErr) {
          console.error("Username update error:", updateErr);
          return res.status(500).json({
            success: false,
            message: "Failed to update username"
          });
        }

        if (result.affectedRows === 0) {
          // Add debug log
          console.log("No rows affected. Current values:", {
            newUsername,
            currentUsername,
            sql: updateQuery
          });
          return res.status(404).json({
            success: false,
            message: "User not found"
          });
        }

        console.log("Username updated successfully:", {
          from: currentUsername,
          to: newUsername
        });
        
        res.json({
          success: true,
          message: "Username updated successfully",
          newUsername: newUsername
        });
      });
    });
  } catch (error) {
    console.error("Server error during username update:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating username"
    });
  }
});

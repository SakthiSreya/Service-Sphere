import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "./Service.js";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { getDay } from "date-fns";
import { OAuth2Client } from "google-auth-library";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const JWT_SECRET = process.env.JWT_SECRET || "secret";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ─── Database Tables Initialization ─────────────────────────────────────────

pool.query(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  name TEXT, 
  email TEXT UNIQUE, 
  password TEXT, 
  role TEXT,
  account_status TEXT DEFAULT 'Active',
  phone TEXT, 
  area TEXT, 
  experience TEXT, 
  aadhaar TEXT, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

pool.query(`CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id INTEGER, service_name TEXT, description TEXT, category TEXT, price REAL, availability TEXT DEFAULT 'Available', location TEXT, image_url TEXT, status TEXT DEFAULT 'Pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

pool.query(`CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, service_id INTEGER, customer_id INTEGER, provider_id INTEGER, booking_start_time DATETIME, status TEXT DEFAULT 'Pending', payment_method TEXT DEFAULT 'COD', payment_status TEXT DEFAULT 'Pending', cancelled_by TEXT DEFAULT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

// ✅ schedules now has service_id — each service has its own schedule
pool.query(`CREATE TABLE IF NOT EXISTS schedules (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id INTEGER, service_id INTEGER, day_of_week INTEGER, start_time TEXT, end_time TEXT, is_available INTEGER DEFAULT 0)`);

pool.query(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id INTEGER, service_id INTEGER, customer_id INTEGER, rating INTEGER, comment TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

pool.query(`CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'Customer',
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ─── Migrations ──────────────────────────────────────────────────────────────

try {
  await pool.query(`ALTER TABLE bookings ADD COLUMN cancelled_by TEXT DEFAULT NULL`);
  console.log("Migration: cancelled_by column added.");
} catch (e) {
  console.log("cancelled_by column already exists, skipping migration.");
}

try {
  await pool.query(`ALTER TABLE contact_messages ADD COLUMN role TEXT DEFAULT 'Customer'`);
  console.log("Migration: role column added to contact_messages.");
} catch (e) {
  console.log("contact_messages.role column already exists, skipping.");
}

try {
  await pool.query(`ALTER TABLE users ADD COLUMN account_status TEXT DEFAULT 'Active'`);
  console.log("Migration: account_status column added.");
} catch (e) {
  console.log("account_status column already exists, skipping migration.");
}

// ✅ Migration: add service_id to existing schedules table
try {
  await pool.query(`ALTER TABLE schedules ADD COLUMN service_id INTEGER`);
  console.log("Migration: service_id column added to schedules.");
} catch (e) {
  console.log("schedules.service_id already exists, skipping.");
}

// ✅ Fix: set availability to 'Available' for any existing services that have null/empty availability
try {
  await pool.query(`UPDATE services SET availability = 'Available' WHERE availability IS NULL OR availability = ''`);
  console.log("Migration: fixed null availability values in services.");
} catch (e) {
  console.log("Availability fix skipped.");
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'Admin') return res.status(403).json({ message: "Admin access required" });
  next();
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────

app.post("/api/signup", async (req, res) => {
  const { name, email, password, role, phone, area, experience, aadhaar } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password, role, phone, area, experience, aadhaar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, email, hashed, role || "customer", phone, area, experience || null, aadhaar || null]
    );
    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "User might already exist or DB error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Invalid user" });
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ message: "Wrong password" });
    if (rows[0].account_status === 'Banned') return res.status(403).json({ message: "Your account has been banned. Contact support." });
    const token = jwt.sign({ id: rows[0].id, role: rows[0].role }, JWT_SECRET, { expiresIn: "6h" });
    res.json({ message: "Login success", token, user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, sub: googleId } = ticket.getPayload();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    let user;
    if (rows.length > 0) {
      if (rows[0].account_status === 'Banned') return res.status(403).json({ message: "Your account has been banned. Contact support." });
      user = rows[0];
    } else {
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, googleId, "Customer"]
      );
      const [newRows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
      user = newRows[0];
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "6h" });
    res.json({ message: "Login success", token, user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google login failed" });
  }
});

// ─── Upload ───────────────────────────────────────────────────────────────────

app.post("/api/upload", auth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const url = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url });
});

// ─── Services ────────────────────────────────────────────────────────────────

app.get("/api/services", async (req, res) => {
  try {
    const { provider_id, category, location, search } = req.query;
    let query = `SELECT s.*, u.name as provider_name, u.phone as provider_phone, u.area as provider_area,
        ROUND(AVG(r.rating), 1) as average_rating, 
        COUNT(r.id) as review_count
        FROM services s
        LEFT JOIN users u ON s.provider_id = u.id
        LEFT JOIN reviews r ON r.service_id = s.id
        WHERE 1=1`;
    const params = [];
    if (provider_id) { query += " AND s.provider_id = ?"; params.push(provider_id); }
    else { query += " AND s.status = 'Approved'"; }
    if (category && category !== "All") { query += " AND s.category = ?"; params.push(category); }
    if (location) { query += " AND s.location LIKE ?"; params.push(`%${location}%`); }
    if (search) { query += " AND s.service_name LIKE ?"; params.push(`%${search}%`); }
    query += " GROUP BY s.id";
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

app.post("/api/services", auth, async (req, res) => {
  const { service_name, description, category, price, location, image_url, availability } = req.body;
  try {
    await pool.query(
      "INSERT INTO services (provider_id, service_name, description, category, price, location, image_url, availability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')",
      // ✅ fallback to 'Available' if provider somehow sends empty/null
      [req.user.id, service_name, description, category, price, location, image_url, availability || 'Available']
    );
    res.json({ message: "Service submitted for approval" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add service" });
  }
});

app.put("/api/services/:id", auth, async (req, res) => {
  const { service_name, description, category, price, location, image_url, availability } = req.body;
  try {
    await pool.query(
      "UPDATE services SET service_name=?, description=?, category=?, price=?, location=?, image_url=?, availability=? WHERE id=? AND provider_id=?",
      [service_name, description, category, price, location, image_url, availability || 'Available', req.params.id, req.user.id]
    );
    res.json({ message: "Service updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update service" });
  }
});

app.delete("/api/services/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM services WHERE id=? AND provider_id=?", [req.params.id, req.user.id]);
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete service" });
  }
});

// ─── Bookings ────────────────────────────────────────────────────────────────

app.get("/api/bookings", auth, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === "provider" || req.user.role === "Service Provider") {
      query = `SELECT b.*, s.service_name, s.price,
        u.name as customer_name, u.email as customer_email,
        u.phone as customer_phone, u.area as customer_area,
        r.id as review_id, r.rating, r.comment
        FROM bookings b
        LEFT JOIN services s ON b.service_id = s.id
        LEFT JOIN users u ON b.customer_id = u.id
        LEFT JOIN reviews r ON r.booking_id = b.id
        WHERE b.provider_id = ?
        ORDER BY b.created_at DESC`;
      params = [req.user.id];
    } else {
      query = `SELECT b.*, s.service_name, s.price,
               u.name as provider_name,
               r.id as review_id, r.rating, r.comment
               FROM bookings b
               LEFT JOIN services s ON b.service_id = s.id
               LEFT JOIN users u ON b.provider_id = u.id
               LEFT JOIN reviews r ON r.booking_id = b.id
               WHERE b.customer_id = ?
               ORDER BY b.created_at DESC`;
      params = [req.user.id];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

app.post("/api/bookings", auth, async (req, res) => {
  const { service_id, booking_start_time, payment_method, payment_status } = req.body;
  try {
    const [services] = await pool.query("SELECT * FROM services WHERE id = ?", [service_id]);
    if (services.length === 0) return res.status(404).json({ message: "Service not found" });
    const service = services[0];
    const finalMethod = payment_method || 'COD';
    const finalStatus = payment_status || 'Pending';
    await pool.query(
      "INSERT INTO bookings (service_id, customer_id, provider_id, booking_start_time, status, payment_method, payment_status) VALUES (?, ?, ?, ?, 'Pending', ?, ?)",
      [service_id, req.user.id, service.provider_id, booking_start_time, finalMethod, finalStatus]
    );
    res.json({ message: "Booking created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create booking" });
  }
});

app.put("/api/bookings/:id/status", auth, async (req, res) => {
  const { status } = req.body;
  try {
    const [bookings] = await pool.query("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (bookings.length === 0) return res.status(404).json({ message: "Booking not found" });
    const booking = bookings[0];
    let updatedPaymentStatus = booking.payment_status;
    const normalizedIncomingStatus = status ? status.trim().toLowerCase() : "";
    const normalizedDbMethod = booking.payment_method ? booking.payment_method.trim().toLowerCase() : "";
    if (normalizedIncomingStatus === 'completed' && normalizedDbMethod === 'cod') {
      updatedPaymentStatus = 'Paid';
    }
    await pool.query("UPDATE bookings SET status=?, payment_status=? WHERE id=?", [status, updatedPaymentStatus, req.params.id]);
    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

app.put("/api/bookings/:id/cancel", auth, async (req, res) => {
  try {
    const [bookings] = await pool.query("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (bookings.length === 0) return res.status(404).json({ message: "Booking not found" });
    const booking = bookings[0];
    const userId = parseInt(req.user.id);
    const isCustomer = userId === parseInt(booking.customer_id);
    const isProvider = userId === parseInt(booking.provider_id);
    if (!isCustomer && !isProvider) return res.status(403).json({ message: "Not authorized to cancel this booking" });
    if (isProvider) {
      if (booking.status !== "Pending" && booking.status !== "Confirmed")
        return res.status(400).json({ message: "Providers can only cancel Pending or Confirmed bookings" });
      await pool.query("UPDATE bookings SET status = 'Cancelled', cancelled_by = 'provider' WHERE id = ?", [req.params.id]);
      return res.json({ message: "Booking cancelled successfully" });
    }
    if (isCustomer) {
      if (booking.status !== "Pending")
        return res.status(400).json({ message: "Customers can only cancel Pending bookings" });
      const bookingTime = new Date(booking.booking_start_time);
      const now = new Date();
      const diffInHours = (bookingTime - now) / (1000 * 60 * 60);
      if (diffInHours < 2) return res.status(400).json({ message: "Cancellations must be made at least 2 hours before the service time." });
      const isOnlinePaid = booking.payment_method?.trim().toLowerCase() === "online" && booking.payment_status?.trim().toLowerCase() === "paid";
      const newPaymentStatus = isOnlinePaid ? "Refunded" : booking.payment_status;
      await pool.query("UPDATE bookings SET status = 'Cancelled', cancelled_by = 'customer', payment_status = ? WHERE id = ?", [newPaymentStatus, req.params.id]);
      return res.json({ message: "Booking cancelled successfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// ─── Schedules ────────────────────────────────────────────────────────────────

// ✅ GET: fetch schedule for a specific service (pass ?service_id=X)
app.get("/api/schedules", auth, async (req, res) => {
  const { service_id } = req.query;
  try {
    let query = "SELECT * FROM schedules WHERE provider_id = ?";
    const params = [req.user.id];
    if (service_id) {
      query += " AND service_id = ?";
      params.push(service_id);
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch schedules" });
  }
});

// ✅ POST: save schedule for a specific service (body must include service_id)
app.post("/api/schedules", auth, async (req, res) => {
  const { schedules, service_id } = req.body;
  if (!service_id) return res.status(400).json({ message: "service_id is required" });
  try {
    // Delete only this service's schedules, not ALL provider schedules
    await pool.query(
      "DELETE FROM schedules WHERE provider_id = ? AND service_id = ?",
      [req.user.id, service_id]
    );
    for (const s of schedules) {
      await pool.query(
        "INSERT INTO schedules (provider_id, service_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?, ?)",
        [req.user.id, service_id, s.day_of_week, s.start_time, s.end_time, s.is_available ? 1 : 0]
      );
    }
    res.json({ message: "Schedule saved" });
  } catch (err) {
    res.status(500).json({ message: "Failed to save schedule" });
  }
});

// ─── Availability ─────────────────────────────────────────────────────────────

// ✅ Now uses serviceId instead of providerId — schedules are per-service
// ✅ Filters out past time slots when the requested date is today
app.get("/api/availability/:serviceId/:date", async (req, res) => {
  const { serviceId, date } = req.params;
  try {
    // Get the provider from the service
    const [serviceRows] = await pool.query("SELECT provider_id FROM services WHERE id = ?", [serviceId]);
    if (serviceRows.length === 0) return res.json({ availableSlots: [] });
    const providerId = serviceRows[0].provider_id;

    const dayOfWeek = getDay(new Date(date));

    const [schedules] = await pool.query(
      "SELECT * FROM schedules WHERE service_id = ? AND provider_id = ? AND day_of_week = ? AND is_available = 1",
      [serviceId, providerId, dayOfWeek]
    );
    if (schedules.length === 0) return res.json({ availableSlots: [] });

    const schedule = schedules[0];
    const slots = [];
    let [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    while (startH < endH || (startH === endH && startM < endM)) {
      slots.push(`${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`);
      startH += 1;
    }

    // Remove already-booked slots
    const [booked] = await pool.query(
      "SELECT booking_start_time FROM bookings WHERE provider_id = ? AND service_id = ? AND DATE(booking_start_time) = ? AND status NOT IN ('Cancelled', 'Rejected')",
      [providerId, serviceId, date]
    );
    const bookedTimes = booked.map(b => b.booking_start_time.slice(11, 16));
    let availableSlots = slots.filter(s => !bookedTimes.includes(s));

    // ✅ Bug fix: if booking date is today, remove slots that have already passed
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date === todayStr) {
      const nowH = today.getHours();
      const nowM = today.getMinutes();
      availableSlots = availableSlots.filter(slot => {
        const [slotH, slotM] = slot.split(':').map(Number);
        // Keep slot only if it's at least 1 hour from now
        return slotH > nowH + 1 || (slotH === nowH + 1 && slotM >= nowM);
      });
    }

    res.json({ availableSlots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch availability" });
  }
});

// ─── Users ───────────────────────────────────────────────────────────────────

app.put("/api/users/me", auth, async (req, res) => {
  const { name, email } = req.body;
  try {
    await pool.query("UPDATE users SET name=?, email=? WHERE id=?", [name, email, req.user.id]);
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.put("/api/users/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both fields are required" });
  if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) return res.status(401).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=? WHERE id=?", [hashed, req.user.id]);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to change password" });
  }
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

app.post("/api/reviews", auth, async (req, res) => {
  const { booking_id, service_id, rating, comment } = req.body;
  try {
    const [bookings] = await pool.query("SELECT * FROM bookings WHERE id = ? AND customer_id = ?", [booking_id, req.user.id]);
    if (bookings.length === 0) return res.status(404).json({ message: "Booking not found" });
    if (bookings[0].status?.toLowerCase() !== "completed") return res.status(400).json({ message: "You can only review completed bookings" });
    const [existing] = await pool.query("SELECT * FROM reviews WHERE booking_id = ? AND customer_id = ?", [booking_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ message: "You already reviewed this booking" });
    await pool.query("INSERT INTO reviews (booking_id, service_id, customer_id, rating, comment) VALUES (?, ?, ?, ?, ?)", [booking_id, service_id, req.user.id, rating, comment]);
    res.json({ message: "Review added" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add review" });
  }
});

app.get("/api/reviews/:serviceId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name as customer_name FROM reviews r LEFT JOIN users u ON r.customer_id = u.id WHERE r.service_id = ? ORDER BY r.created_at DESC`,
      [req.params.serviceId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// ─── Contact Messages ─────────────────────────────────────────────────────────

app.post("/api/contact", async (req, res) => {
  const { name, email, message, role } = req.body;
  if (!name || !email || !message) return res.status(400).json({ message: "All fields are required" });
  try {
    await pool.query("INSERT INTO contact_messages (name, email, message, role) VALUES (?, ?, ?, ?)", [name, email, message, role || 'Customer']);
    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

app.get("/api/admin/services", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT s.*, u.name as provider_name FROM services s LEFT JOIN users u ON s.provider_id = u.id ORDER BY s.created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

app.get("/api/admin/stats", auth, adminOnly, async (req, res) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) as total_users FROM users");
    const [[providers]] = await pool.query("SELECT COUNT(*) as total_providers FROM users WHERE role = 'Service Provider'");
    const [[pendingProviders]] = await pool.query("SELECT COUNT(*) as pending_providers FROM users WHERE role = 'Service Provider' AND (account_status = 'Pending' OR account_status IS NULL)");
    const [[services]] = await pool.query("SELECT COUNT(*) as total_services FROM services");
    const [[pendingServices]] = await pool.query("SELECT COUNT(*) as pending_services FROM services WHERE status = 'Pending'");
    const [[bookings]] = await pool.query("SELECT COUNT(*) as completed_bookings FROM bookings WHERE status = 'Completed'");
    const [[unreadMessages]] = await pool.query("SELECT COUNT(*) as unread_messages FROM contact_messages WHERE is_read = 0");
    const [topCategories] = await pool.query(`
      SELECT s.category, COUNT(b.id) as booking_count 
      FROM bookings b JOIN services s ON b.service_id = s.id 
      GROUP BY s.category ORDER BY booking_count DESC LIMIT 4
    `);
    const [topServices] = await pool.query(`
      SELECT s.service_name, COUNT(b.id) as booking_count 
      FROM bookings b JOIN services s ON b.service_id = s.id 
      GROUP BY s.id ORDER BY booking_count DESC LIMIT 4
    `);
    res.json({
      stats: {
        total_users: users.total_users,
        total_providers: providers.total_providers,
        pending_providers: pendingProviders.pending_providers,
        total_services: services.total_services,
        pending_services: pendingServices.pending_services,
        completed_bookings: bookings.completed_bookings,
        unread_messages: unreadMessages.unread_messages,
      },
      topCategories,
      topServices,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

app.put("/api/admin/services/:id/status", auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE services SET status=? WHERE id=?", [status, req.params.id]);
    res.json({ message: "Service status updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update service" });
  }
});

app.get("/api/admin/users", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, account_status, phone, area, experience, aadhaar, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.put("/api/admin/users/:id/status", auth, adminOnly, async (req, res) => {
  const { account_status } = req.body;
  const allowed = ['Active', 'Banned', 'Pending'];
  if (!allowed.includes(account_status)) return res.status(400).json({ message: "Invalid status" });
  try {
    await pool.query("UPDATE users SET account_status=? WHERE id=?", [account_status, req.params.id]);
    res.json({ message: `User status updated to ${account_status}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user status" });
  }
});

app.get("/api/admin/contact-messages", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

app.put("/api/admin/contact-messages/:id/read", auth, adminOnly, async (req, res) => {
  try {
    await pool.query("UPDATE contact_messages SET is_read=1 WHERE id=?", [req.params.id]);
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark message" });
  }
});

app.delete("/api/admin/contact-messages/:id", auth, adminOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM contact_messages WHERE id=?", [req.params.id]);
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// ─── AI Endpoint ──────────────────────────────────────────────────────────────

app.post("/api/ai/analyze", auth, async (req, res) => {
  const { type, problem, base64, mediaType } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const basePrompt = `
      You are the backend AI for ServiceSphere, an on-demand home services platform.
      Analyze the user's issue and respond with a raw JSON object matching this schema perfectly:
      {
        "detected_issue": "Short name/summary of the issue found (e.g. Broken AC Compressor)",
        "category": "Must be exactly one of: Plumbing, Electrical, Carpentry, House Cleaning, IT Services, Appliance Repair, Gardening, Tutoring, Other",
        "urgency": "Low or Medium or High",
        "confidence": "A percentage string like 95%",
        "summary": "A friendly 1-2 sentence breakdown explaining what is likely wrong.",
        "service_needed": "Specific service type required (e.g. AC Repair & Gas Refill)",
        "urgency_reason": "Brief explanation of why this urgency level was selected.",
        "tips": ["A practical troubleshooting or safety tip", "Another helpful tip if applicable"]
      }
      Do not return any markdown wrappers, no backticks, and no text outside the JSON object.
    `;
    let responseText;
    if (type === "text") {
      if (!problem) return res.status(400).json({ message: "No problem description provided" });
      const fullPrompt = `${basePrompt}\n\nUser Problem Description: "${problem}"`;
      const response = await model.generateContent(fullPrompt);
      responseText = response.response.text();
    } else if (type === "image") {
      if (!base64 || !mediaType) return res.status(400).json({ message: "Missing image payload components" });
      const imagePart = { inlineData: { data: base64, mimeType: mediaType } };
      const fullPrompt = `${basePrompt}\n\nAnalyze this attached image showing a home issue layout.`;
      const response = await model.generateContent([fullPrompt, imagePart]);
      responseText = response.response.text();
    } else {
      return res.status(400).json({ message: "Invalid analysis type requested" });
    }
    res.json({ result: responseText });
  } catch (error) {
    console.error("Gemini AI API Error:", error);
    res.status(500).json({ message: "AI generation failed internally on server side." });
  }
});

// ─── Boot-time Data Fix ───────────────────────────────────────────────────────

try {
  await pool.query(`
    UPDATE bookings 
    SET payment_status = 'Paid' 
    WHERE LOWER(status) = 'completed' AND LOWER(payment_method) = 'cod'
  `);
  console.log("Migration executed: Completed COD bookings set to Paid.");
} catch (mErr) {
  console.log("Migration skipped or table not initialized yet.");
}

app.listen(5000, () => console.log("Server at http://localhost:5000"));
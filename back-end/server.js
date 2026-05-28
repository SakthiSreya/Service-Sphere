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

// FIXED: Added missing signup columns (phone, area, experience, aadhaar) to schema
pool.query(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  name TEXT, 
  email TEXT UNIQUE, 
  password TEXT, 
  role TEXT, 
  phone TEXT, 
  area TEXT, 
  experience TEXT, 
  aadhaar TEXT, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

pool.query(`CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id INTEGER, service_name TEXT, description TEXT, category TEXT, price REAL, availability TEXT, location TEXT, image_url TEXT, status TEXT DEFAULT 'Pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
pool.query(`CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, service_id INTEGER, customer_id INTEGER, provider_id INTEGER, booking_start_time DATETIME, status TEXT DEFAULT 'Pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
pool.query(`CREATE TABLE IF NOT EXISTS schedules (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id INTEGER, day_of_week INTEGER, start_time TEXT, end_time TEXT, is_available INTEGER DEFAULT 0)`);
pool.query(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id INTEGER, service_id INTEGER, customer_id INTEGER, rating INTEGER, comment TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

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

// SIGNUP
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

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Invalid user" });
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ message: "Wrong password" });
    const token = jwt.sign({ id: rows[0].id, role: rows[0].role }, JWT_SECRET, { expiresIn: "6h" });
    res.json({ message: "Login success", token, user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
});

// GOOGLE LOGIN
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

// IMAGE UPLOAD
app.post("/api/upload", auth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const url = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url });
});

// SERVICES - Get all
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

// SERVICES - Add
app.post("/api/services", auth, async (req, res) => {
  const { service_name, description, category, price, location, image_url, availability } = req.body;
  try {
    await pool.query(
      "INSERT INTO services (provider_id, service_name, description, category, price, location, image_url, availability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Approved')",
      [req.user.id, service_name, description, category, price, location, image_url, availability]
    );
    res.json({ message: "Service added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add service" });
  }
});

// SERVICES - Update
app.put("/api/services/:id", auth, async (req, res) => {
  const { service_name, description, category, price, location, image_url, availability } = req.body;
  try {
    await pool.query(
      "UPDATE services SET service_name=?, description=?, category=?, price=?, location=?, image_url=?, availability=? WHERE id=? AND provider_id=?",
      [service_name, description, category, price, location, image_url, availability, req.params.id, req.user.id]
    );
    res.json({ message: "Service updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update service" });
  }
});

// SERVICES - Delete
app.delete("/api/services/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM services WHERE id=? AND provider_id=?", [req.params.id, req.user.id]);
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete service" });
  }
});

// BOOKINGS - Get
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

// BOOKINGS - Create
app.post("/api/bookings", auth, async (req, res) => {
  const { service_id, booking_start_time } = req.body;
  try {
    const [services] = await pool.query("SELECT * FROM services WHERE id = ?", [service_id]);
    if (services.length === 0) return res.status(404).json({ message: "Service not found" });
    const service = services[0];
    await pool.query(
      "INSERT INTO bookings (service_id, customer_id, provider_id, booking_start_time, status) VALUES (?, ?, ?, ?, 'Pending')",
      [service_id, req.user.id, service.provider_id, booking_start_time]
    );
    res.json({ message: "Booking created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create booking" });
  }
});

// BOOKINGS - Update status
app.put("/api/bookings/:id/status", auth, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE bookings SET status=? WHERE id=?", [status, req.params.id]);
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// SCHEDULES - Get
app.get("/api/schedules", auth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM schedules WHERE provider_id = ?", [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch schedules" });
  }
});

// SCHEDULES - Save
app.post("/api/schedules", auth, async (req, res) => {
  const { schedules } = req.body;
  try {
    await pool.query("DELETE FROM schedules WHERE provider_id = ?", [req.user.id]);
    for (const s of schedules) {
      await pool.query(
        "INSERT INTO schedules (provider_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, s.day_of_week, s.start_time, s.end_time, s.is_available ? 1 : 0]
      );
    }
    res.json({ message: "Schedule saved" });
  } catch (err) {
    res.status(500).json({ message: "Failed to save schedule" });
  }
});

// AVAILABILITY
app.get("/api/availability/:providerId/:date", async (req, res) => {
  const { providerId, date } = req.params;
  try {
    const dayOfWeek = getDay(new Date(date));
    const [schedules] = await pool.query(
      "SELECT * FROM schedules WHERE provider_id = ? AND day_of_week = ? AND is_available = 1",
      [providerId, dayOfWeek]
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
    const [booked] = await pool.query(
      "SELECT booking_start_time FROM bookings WHERE provider_id = ? AND DATE(booking_start_time) = ? AND status != 'Rejected'",
      [providerId, date]
    );
    const bookedTimes = booked.map(b => b.booking_start_time.slice(11, 16));
    const availableSlots = slots.filter(s => !bookedTimes.includes(s));
    res.json({ availableSlots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch availability" });
  }
});

// USERS - Update profile
app.put("/api/users/me", auth, async (req, res) => {
  const { name, email } = req.body;
  try {
    await pool.query("UPDATE users SET name=?, email=? WHERE id=?", [name, email, req.user.id]);
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ADMIN - Get all services
app.get("/api/admin/services", auth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT s.*, u.name as provider_name FROM services s LEFT JOIN users u ON s.provider_id = u.id");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

// ADMIN - Approve/Reject service
app.put("/api/admin/services/:id", auth, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE services SET status=? WHERE id=?", [status, req.params.id]);
    res.json({ message: "Service status updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update service" });
  }
});

// ADMIN - Get all users
app.get("/api/admin/users", auth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role, created_at FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// REVIEWS - Add
app.post("/api/reviews", auth, async (req, res) => {
  const { booking_id, service_id, rating, comment } = req.body;
  try {
    const [bookings] = await pool.query("SELECT * FROM bookings WHERE id = ? AND customer_id = ?", [booking_id, req.user.id]);
    if (bookings.length === 0) return res.status(404).json({ message: "Booking not found" });
    if (bookings[0].status?.toLowerCase() !== "completed") return res.status(400).json({ message: "You can only review completed bookings" });
    const [existing] = await pool.query("SELECT * FROM reviews WHERE booking_id = ? AND customer_id = ?", [booking_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ message: "You already reviewed this booking" });
    await pool.query(
      "INSERT INTO reviews (booking_id, service_id, customer_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [booking_id, service_id, req.user.id, rating, comment]
    );
    res.json({ message: "Review added" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add review" });
  }
});

// REVIEWS - Get by service
app.get("/api/reviews/:serviceId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name as customer_name 
       FROM reviews r 
       LEFT JOIN users u ON r.customer_id = u.id 
       WHERE r.service_id = ? 
       ORDER BY r.created_at DESC`,
      [req.params.serviceId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// TEMP - create admin (delete after first use!)
app.get("/api/create-admin", async (req, res) => {
  const hashed = await bcrypt.hash("admin123", 10);
  await pool.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    ["Admin", "admin@servicesphere.com", hashed, "Admin"]);
  res.json({ message: "Admin created! Now delete this route." });
});

// =========================================================================
// ✅ CLEANED & ACTIVE AI ENDPOINT (Gemini-2.5-Flash Only)
// =========================================================================
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
      const imagePart = {
        inlineData: {
          data: base64,
          mimeType: mediaType
        }
      };
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

app.listen(5000, () => console.log("Server at http://localhost:5000"));
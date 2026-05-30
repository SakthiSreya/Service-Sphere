import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'ServeNest.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    phone TEXT,
    area TEXT,
    experience TEXT,
    profile_photo TEXT,
    aadhaar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER,
    service_name TEXT,
    description TEXT,
    category TEXT,
    price REAL,
    availability TEXT,
    location TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    customer_id INTEGER,
    provider_id INTEGER,
    booking_start_time DATETIME,
    status TEXT DEFAULT 'Pending',
    payment_method TEXT DEFAULT 'COD',
    payment_status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER,
    day_of_week INTEGER,
    start_time TEXT,
    end_time TEXT,
    is_available INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    service_id INTEGER,
    customer_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const addColumnIfNotExists = (table, column, type) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  } catch (e) { }
};

addColumnIfNotExists('users', 'phone', 'TEXT');
addColumnIfNotExists('users', 'area', 'TEXT');
addColumnIfNotExists('users', 'experience', 'TEXT');
addColumnIfNotExists('users', 'profile_photo', 'TEXT');
addColumnIfNotExists('users', 'aadhaar', 'TEXT');
addColumnIfNotExists('users', 'account_status', "TEXT DEFAULT 'Active'");
addColumnIfNotExists('bookings', 'payment_method', "TEXT DEFAULT 'COD'");
addColumnIfNotExists('bookings', 'payment_status', "TEXT DEFAULT 'Pending'");
addColumnIfNotExists('bookings', 'cancelled_by', "TEXT DEFAULT NULL");
addColumnIfNotExists('schedules', 'service_id', 'INTEGER');
addColumnIfNotExists('contact_messages', 'role', "TEXT DEFAULT 'Customer'");

const pool = {
  query: async (sql, params = []) => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          const rows = stmt.all(...params);
          resolve([rows]);
        } else {
          const result = stmt.run(...params);
          resolve([{ affectedRows: result.changes, insertId: result.lastInsertRowid }]);
        }
      } catch (err) {
        console.error("DB Query Error:", err);
        reject(err);
      }
    });
  }
};

export default pool;
import Database from 'better-sqlite3';

const db = new Database('serviceSphere.db');
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
    status TEXT DEFAULT 'Approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    customer_id INTEGER,
    provider_id INTEGER,
    booking_start_time DATETIME,
    status TEXT DEFAULT 'Pending',
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

// Add new columns if they don't exist (safe to run every time)
const addColumnIfNotExists = (table, column, type) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  } catch (e) {
    // Column already exists, ignore
  }
};

addColumnIfNotExists('users', 'phone', 'TEXT');
addColumnIfNotExists('users', 'area', 'TEXT');
addColumnIfNotExists('users', 'experience', 'TEXT');
addColumnIfNotExists('users', 'profile_photo', 'TEXT');
addColumnIfNotExists('users', 'aadhaar', 'TEXT');

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
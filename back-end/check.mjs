import pool from './Service.js';

const [bookings] = await pool.query('SELECT * FROM bookings');
console.log('BOOKINGS:', JSON.stringify(bookings, null, 2));

const [users] = await pool.query('SELECT id, name, role FROM users');
console.log('USERS:', JSON.stringify(users, null, 2));
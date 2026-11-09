const db = require('../database/db');
const users = db.db.prepare('SELECT id, email, username, password_hash, role FROM users').all();
console.log(JSON.stringify(users, null, 2));

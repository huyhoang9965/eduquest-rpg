const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'pgadmin', 'pgadmin4.db');
const db = new DatabaseSync(dbPath);

console.log('keys table:');
try {
  console.log(db.prepare("SELECT * FROM keys").all());
} catch (e) {
  console.log('keys err:', e.message);
}

console.log('user table:');
try {
  console.log(db.prepare("SELECT * FROM user").all());
} catch (e) {
  console.log('user err:', e.message);
}

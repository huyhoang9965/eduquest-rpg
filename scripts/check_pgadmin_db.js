const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'pgadmin', 'pgadmin4.db');
try {
  const db = new DatabaseSync(dbPath);
  const server = db.prepare("SELECT * FROM server WHERE id=1").get();
  console.log('Server row:', server);
} catch (e) {
  console.error(e.message);
}

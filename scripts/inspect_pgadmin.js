const { DatabaseSync } = require('node:sqlite');
const path = 'C:/Users/asus/AppData/Roaming/pgadmin/pgadmin4.db';

const db = new DatabaseSync(path);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in pgadmin4.db:', tables.map(t => t.name));

const serverSchema = db.prepare("PRAGMA table_info(server)").all();
console.log('Server columns:', serverSchema.map(c => c.name));

const servers = db.prepare("SELECT * FROM server").all();
console.log('Servers:');
console.dir(servers, { depth: null });

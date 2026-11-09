const { DatabaseSync } = require('node:sqlite');
const path = 'C:/Users/asus/AppData/Roaming/pgadmin/pgadmin4.db';

const db = new DatabaseSync(path);
db.exec("UPDATE server SET password = NULL, save_password = 0 WHERE id = 1;");
console.log('Cleared saved password in pgadmin4.db');

const s = db.prepare("SELECT id, name, host, port, username, password, save_password FROM server").all();
console.table(s);

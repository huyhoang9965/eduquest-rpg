const { pool } = require('../database/pg_db');

async function checkCatalog() {
  const items = await pool.query('SELECT id, name, type FROM item_catalog');
  const skills = await pool.query('SELECT id, name, type FROM skill_catalog');
  const pets = await pool.query('SELECT id, name, element FROM pet_catalog');
  
  console.log('=== ITEMS ===');
  console.table(items.rows);
  console.log('=== SKILLS ===');
  console.table(skills.rows);
  console.log('=== PETS ===');
  console.table(pets.rows);

  await pool.end();
}

checkCatalog();

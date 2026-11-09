const { pool } = require('../database/pg_db');
const fs = require('fs');
const path = require('path');

async function syncToPostgres() {
  const filePath = path.join(__dirname, '..', 'data', 'custom-question-sets.json');
  const sets = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`Đang đồng bộ ${sets.length} bộ câu hỏi vào PostgreSQL (eduquest)...`);

  for (const s of sets) {
    await pool.query(`
      INSERT INTO custom_question_sets (id, title, subject, grade, topic, description, difficulty, status, questions, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        subject = EXCLUDED.subject,
        grade = EXCLUDED.grade,
        topic = EXCLUDED.topic,
        description = EXCLUDED.description,
        difficulty = EXCLUDED.difficulty,
        status = EXCLUDED.status,
        questions = EXCLUDED.questions,
        updated_at = CURRENT_TIMESTAMP;
    `, [
      s.id,
      s.title,
      s.subject || 'math',
      s.grade || 5,
      s.topic || 'Chủ đề tổng hợp',
      s.description || '',
      s.difficulty || 'medium',
      s.status || 'published',
      JSON.stringify(s.questions || [])
    ]);
    console.log(`✓ Đồng bộ vào PostgreSQL: [${s.title}] (${s.questions ? s.questions.length : 0} câu) - Trạng thái: ${s.status}`);
  }

  const check = await pool.query('SELECT id, title, status, jsonb_array_length(questions) as q_count FROM custom_question_sets');
  console.log('\n=== DỮ LIỆU BỘ CÂU HỎI TRONG POSTGRESQL ===');
  console.table(check.rows);

  await pool.end();
}

syncToPostgres().catch(err => {
  console.error('Lỗi sync PostgreSQL:', err);
  process.exit(1);
});

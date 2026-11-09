const { Client } = require('pg');

async function testPw(pw) {
  const c = new Client({ host: '127.0.0.1', port: 5432, user: 'postgres', password: pw, database: 'postgres' });
  try {
    await c.connect();
    console.log(`✓ SUCCESS: [${pw}]`);
    await c.end();
  } catch (e) {
    console.log(`✗ FAILED: [${pw}] => ${e.message}`);
  }
}

async function run() {
  await testPw('Hoang2005@');
  await testPw('Hoang2005@ ');
  await testPw(' Hoang2005@');
  await testPw('Hoáng2005@');
  await testPw('Hoàng2005@');
  await testPw('HOANG2005@');
}

run();

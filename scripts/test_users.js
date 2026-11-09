const { Client } = require('pg');

const usernames = ['postgres', 'Hoang', 'hoang', 'asus', 'Asus', 'admin', 'root'];
const passwords = ['Hoang2005@', 'Hoang@2005', 'hoang2005@', 'Hoang2005', 'hoang2005'];

async function testUsers() {
  for (const u of usernames) {
    for (const p of passwords) {
      const client = new Client({
        host: 'localhost',
        port: 5432,
        user: u,
        password: p,
        database: 'postgres',
        connectionTimeoutMillis: 1500
      });

      try {
        await client.connect();
        console.log(`\n🎉 THÀNH CÔNG! Username: "${u}", Password: "${p}"`);
        await client.end();
        return;
      } catch (e) {
        if (e.code === '28P01') {
          // password failed or user does not exist
        } else if (e.code === '3D000') {
          // database postgres does not exist, but auth succeeded!
          console.log(`\n🎉 THÀNH CÔNG (Auth OK)! Username: "${u}", Password: "${p}"`);
          return;
        } else {
          // console.log(`Error ${u}:${p} ->`, e.message);
        }
      } finally {
        try { await client.end(); } catch (e) {}
      }
    }
  }
  console.log("Không thành công với danh sách kết hợp user + password.");
}

testUsers().catch(console.error);

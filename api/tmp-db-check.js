const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: 'postgresql://admin:password@127.0.0.1:5432/christian_platform?schema=public'
  });
  try {
    await client.connect();
    const res = await client.query('select current_user, current_database()');
    console.log(JSON.stringify(res.rows[0]));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();

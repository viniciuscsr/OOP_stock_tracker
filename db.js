const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'node_user',
  host: 'localhost',
  database: 'stock_tracker',
  password: 'node_password',
  port: 5432,
});

module.exports = pool;

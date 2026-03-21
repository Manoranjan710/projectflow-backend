const mysql = require('mysql2/promise');

const pool = mysql.createPool({
     uri: process.env.DATABASE_URL,
     connectionLimit: 10,
     ssl: {
    rejectUnauthorized: true
  }
});

module.exports = pool;
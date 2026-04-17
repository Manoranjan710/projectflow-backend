const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    ca: process.env.DB_SSL_CA,
    rejectUnauthorized: true
  },
  connectionLimit: 10,
});

module.exports = pool;

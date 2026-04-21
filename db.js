const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'barokah_laundry', // Nama disesuaikan dengan gambar
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
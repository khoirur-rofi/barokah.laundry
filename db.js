const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || "shortline.proxy.rlwy.net",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "KYpsnuBMHcdjpHKsCtigYMerATjDRRQP",
    database: process.env.DB_NAME || "railway",
    port: process.env.DB_PORT || 14930
});

module.exports = pool;

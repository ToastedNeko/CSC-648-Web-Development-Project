/*
* This script allows for connecting to the database.
* Worked on by Jake & Tori
*
* */

const mysql = require('mysql2');
require('dotenv').config();

// Connect to the database(s) for mysql
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || '3.132.117.154',
    port: 3306, // mysql port number
    user: process.env.DATABASE_USER || 'ToastedPickles',
    password: process.env.DATABASE_PASSWORD || 'SFSUstudent6789!',
    database: process.env.DATABASE || 'Team2_Database',
    queueLimit: 0,
    connectionLimit: 20,
    waitForConnections: true
});

const promisePool = pool.promise();

module.exports = promisePool;
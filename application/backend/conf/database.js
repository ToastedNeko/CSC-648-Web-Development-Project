/*
* This script allows for connecting to the database.
* Worked on by Jake & Tori
*
* */

const mysql = require('mysql2');
require('dotenv').config();

// Connect to the database(s) for mysql
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || '00.000.00.000', // TODO
    port: 3306, // mysql port number
    user: process.env.DATABASE_USER || 'password',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE || 'Team2_Database',
    queueLimit: 0,
    connectionLimit: 20,
    waitForConnections: true
});

const promisePool = pool.promise();

module.exports = promisePool;
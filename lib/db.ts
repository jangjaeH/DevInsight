import mysql from 'mysql2/promise';

const port: number = parseInt(process.env.DB_PORT || "3306", 10);
export const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: port,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4'
});

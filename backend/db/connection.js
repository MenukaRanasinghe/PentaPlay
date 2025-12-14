import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "123",
  database: "pentaplay",
  connectionLimit: 5,
});

export default db;

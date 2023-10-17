const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost", // Change to your MySQL host
  user: "root",
  password: "",
  database: "v1",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

module.exports = connection;

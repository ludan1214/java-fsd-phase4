/*
TO DO:
-----
READ ALL COMMENTS AND REPLACE VALUES ACCORDINGLY
*/

var mysql = require("mysql");

var con = mysql.createConnection({
  host: "us-cdbr-east-02.cleardb.com",
  user: "b908cf5aad5705", // replace with the database user provided to you
  password: "c08727f3", // replace with the database password provided to you
  database: "heroku_4c22dba2f6b2bcb", // replace with the database user provided to you
  port: 3306
});

con.connect(function(err) {
  if (err) {
    throw err;
  };
  console.log("Connected!");
    var sql = `CREATE TABLE tbl_deals(deal_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                         vendor_name VARCHAR(30),
                                         project_name VARCHAR(300),
                                         project_cost INT)`;
  con.query(sql, function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Table created");
  });
});

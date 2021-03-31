// YOU CAN USE THIS FILE AS REFERENCE FOR SERVER DEVELOPMENT

// include the express module
var express = require("express");

// create an express application
var app = express();

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// native js function for hashing messages with the SHA-256 algorithm
var crypto = require('crypto');

// include the mysql module
var mysql = require("mysql");

var xml2js = require('xml2js');

var xmlParser = xml2js.parseString;

// use express-session
// in mremory session is sufficient for this assignment
app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false
}));

// apply the body-parser middleware to all incoming requests
app.use(bodyparser());
app.use(bodyparser.json());


// Read in XML config file;
var text = fs.readFileSync("./dbconfig.xml").toString('utf-8');

var xmlConfig;
xmlParser(text, function(err,result){
  xmlConfig = result.dbconfig;
});

var cfg = {
  connectionLimit: xmlConfig.connectionLimit[0],
  host: xmlConfig.host[0],
  user: xmlConfig.user[0],
  password: xmlConfig.password[0],
  database: xmlConfig.database[0],
  port: xmlConfig.port[0]
}

// Connect to mysql server
var con = mysql.createPool(cfg);

// server listens on port 9007 for incoming connections
app.listen(process.env.PORT || 9001, () => console.log('Listening on port 9001!'));

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/welcome.html');
});

// // GET method route for the finance page.
// It serves finance.html present in client folder
app.get('/finance',function(req, res) {
  if (req.session.loggedin) {
    res.sendFile(__dirname + '/client/finance.html');
  } else {
    res.redirect('/login');
  }
});

// GET method route for the addEvent page.
// It serves manage.html present in client folder
app.get('/manager',function(req, res) {
  if (req.session.loggedin) {
    res.sendFile(__dirname + '/client/manage.html');
  } else {
    res.redirect('/login');
  }
});

// GET method route for the login page.
// It serves login.html present in client folder
app.get('/login',function(req, res) {
  if(!req.session.loggedin) {
    res.sendFile(__dirname + '/client/login.html');
  } else {
    res.redirect('/finance');
  }
});

// GET method to return the list of deals
// The function queries the tbl_deals table for the list of events and sends the response back to client
app.get('/getListOfDeals', function(req, res) {
  con.query('SELECT * FROM tbl_deals', function(err,result,fields) {
    if (err) throw err;
    if (result.length == 0) {
      console.log("No entries in accounts table");
    } else { // Send Deals List
      res.send(result);
    }
  });
});

// GET method to return the list of accounts
// The function queries the tbl_events table for the list of events and sends the response back to client
app.get('/getListOfUsers', function(req, res) {
  con.query('SELECT * FROM tbl_accounts', function(err,result,fields) {
    if (err) throw err;
    if (result.length == 0) {
      console.log("No entries in accounts table");
    } else { // Send Accounts table
      res.send(result);
    }
  });
});

// POST method to add details of a user in tbl_deals table
app.post('/addDeal', function(req, res) {
    var vendor = req.body.vendor;
    var project = req.body.project;
    var cost = req.body.cost;
    if (vendor && project && cost) {
      var rowToBeInserted = {
        vendor_name: vendor,
        project_name: project,
        projecT_cost: cost
      };
      con.query('INSERT tbl_deals SET ?', rowToBeInserted, function(err, result) {
				if(err) {
				throw err;
				}
				console.log("Value inserted");
			});
    } else {
      console.log("Invalid UserData: one or more entries are missing!")
    }
});

// POST method to delete details of a deal in tbl_deals table
app.post('/deleteDeal', function(req, res) {
  var deal_id = req.body.deal_id;
  console.log(req.body.deal_id);

  con.query('DELETE FROM tbl_deals WHERE deal_id = ?', [deal_id], function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Deal Deleted");
  });
});

// POST method to update details of a new deal
app.post('/updateDeal', function(req, res) {
  var id = req.body.id;
  var vendor = req.body.vendor;
  var project = req.body.project;
  var cost = req.body.cost;
  if (id && vendor && project && cost) {
        con.query('UPDATE tbl_deals SET deal_id = ?, vendor_name = ?, project_name = ?, project_cost = ? WHERE deal_id = ?', [id, vendor, project, cost, id], function(err, result) {
          if(err) {
            throw err;
          }
          console.log("Updated tbl_deals");
        });
  } else { // Send an error
    console.log("Invalid UserData: one or more entries are missing!")
  }
});

// POST method to delete details of a user in user table
app.post('/deleteUser', function(req, res) {
    var login = req.body.login;
    console.log(req.body);

    con.query('DELETE FROM tbl_accounts WHERE acc_login = ?', [login], function(err, result) {
      if(err) {
        throw err;
      }
      console.log("User Deleted");
    });
  });

// POST method to update details of a new event to tbl_events table
app.post('/updateUser', function(req, res) {
    var userName = req.body.name;
    var userLogin = req.body.login;
    var userPass =  crypto.createHash('sha256').update(req.body.password).digest('base64');
    var userId = req.body.id;
    if (userName && userLogin && userPass) {
      con.query('SELECT * FROM tbl_accounts WHERE acc_login = ?', [userLogin], function(error, results, fields) {
  			if (results.length > 0 && results[0].acc_id != userId) {
          // User already Exists
  				res.send('User already used by Another user!');
  			} else {
          con.query('UPDATE tbl_accounts SET acc_name = ?, acc_login = ?, acc_password = ? WHERE acc_id = ?', [userName, userLogin, userPass, userId], function(err, result) {
            if(err) {
              throw err;
            }
            console.log("Updated tbl_accounts");
          });
        }
  		});
    } else { // Send an error
      console.log("Invalid UserData: one or more entries are missing!")
    }
});

// POST method to validate user login
// upon successful login, user session is created
app.post('/sendLoginDetails', function(req, res) {
  var username = req.body.username;
	var password = crypto.createHash('sha256').update(req.body.password).digest('base64');
	if (username && password) {
		con.query('SELECT * FROM tbl_accounts WHERE acc_login = ? AND acc_password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
        req.session.login = username;
				res.redirect('/manager');
			} else {
				res.send('Incorrect Username and/or Password!');
			}
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

// Gets the session for returning the username
app.get('/userLogin', function (req, res) {
  if (req.session.loggedin) {
    res.send(req.session);
  } else {
    res.redirect('/login');
  }
});

// log out of the application
// destroy user session
app.get('/logout', function(req, res) {
  if(!req.session.loggedin) {
    res.send('Session not started, can not logout!');
  } else {
    console.log ("Session Destroyed!");
    req.session.destroy();
    res.redirect('/login');
  }
});

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));

// function to return the 404 message and error to client
app.get('*', function(req, res) {
  res.send("Error 404.");
});

/* SERVER FOR THE APPLICATION */
/******************************/

// dependencies
var express = require("express");
var expresshbs = require("express-handlebars");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");
var mongoose = require("mongoose");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise; 

// database models
var User = require("./models/User");
var Article = require("./models/Article");

var app = express();
var PORT = 3000;

// Set Handlebars as the default templating engine.
app.engine("handlebars", expresshbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Make public a static dir
app.use(express.static("public"));

// body-parser
app.use(bodyParser.urlencoded({
  extended: false
}));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/cheery-scrapio");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// ROUTES //

// TODO: build routes for the application
  // Grab all scraped links
  // Show articles only based on bias
  // add notes to a specific article

app.get("/", function(req, res) {
  // show all articles
  res.render("index");
})

app.get("/left", function(req, res) {
    // grab all left-learning articles
    // return for the get request
});

app.get("/right", function(req, res) {
    // grab all left-learning articles
    // return for the get request
});

app.get("/center", function(req, res) {
    // grab all center (BBC) articles
    // return for the get request
});

// runs requests to add articles to the db
app.get("/scrape", function(req, res) {
  // connect to the left-leaning discussion board Democratic Underground
  request("https://www.democraticunderground.com/?com=forum&id=1014", function(error, response, html) {
    var $ = cheerio.load(html);
    
    var leftResults = {};
    
    var linkStart = "https://www.democraticunderground.com";

    $("td.title").each(function(i, element) {
      
      leftResults.title = $(element).children().text();
      leftResults.link = linkStart + $(element).children().attr("href");
      leftResults.bias = "left";
  
      var newArticle = new Article(leftResults);

      newArticle.save(function(err, doc) {
        if(err) {
          console.log(err);
        } else {
          console.log(doc);
        };
      });
    });
  });

  // connect to the right-leaning discussion board Free Republic
  request("http://www.freerepublic.com/tag/breaking-news/index?tab=articles", function(err, response, html) {
    
    var $ = cheerio.load(html);
  
    var rightResults = {};

    var linkStart = "http://www.freerepublic.com/";
  
    $("li.article").each(function(i, element) {
  
      rightResults.link = linkStart + $(element).find("h3").children().attr("href");
      rightResults.title = $(element).find("h3").children().text();
      rightResults.bias = "right";
      
      var newArticle = new Article(rightResults);
      
      newArticle.save(function(err, doc) {
        if(err) {
          console.log(err);
        } else {
          console.log(doc);
        };
      });
    });
  });
});

// END ROUTES //

// Open and listen to port //
app.listen(PORT, function() {
  console.log("SHHH! We're listening on port: " + PORT);
  console.log("Go to http://localhost:" + PORT);
  console.log("Please make sure to visit and star my repo at https://github.com/JimGray9999/cheery-scrapio");
});
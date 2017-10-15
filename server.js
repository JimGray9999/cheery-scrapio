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
// use for Heroku app if launched
var PORT = process.env.port || 8080;


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
mongoose.connect("mongodb://heroku_k5gw43s4:r9r8bd924m8rj7kpu98qhm9q75@ds121225.mlab.com:21225/heroku_k5gw43s4");
// using Heroku app: mongoose.connect("mongodb://heroku_k5gw43s4:r9r8bd924m8rj7kpu98qhm9q75@ds121225.mlab.com:21225/heroku_k5gw43s4");
// using localhost: mongoose.connect("mongodb://localhost/cheery-scrapio");
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

app.get("/all", function(req, res) {
  // show all articles
  Article.find({}, function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      res.render("index", {article: doc} );
    }
  });
})

app.get("/", function(req, res) {
  res.render("index");
});

// TODO: Filter and show only the selected bias
app.get("/left", function(req, res) {
    // grab all left-learning articles
    // return for the get request
});

app.get("/right", function(req, res) {
    // grab all right-learning articles
    // return for the get request
});

app.get("/center", function(req, res) {
    // grab all center (BBC) articles
    // return for the get request
});

// run requests to add articles to the db
app.get("/scrape/left", function(req, res) {
  // connect to the left-leaning discussion board Democratic Underground
  request("https://www.democraticunderground.com/?com=forum&id=1014", function(error, response, html) {
    var $ = cheerio.load(html);
    
    var leftResults = {};
    
    var linkStart = "https://www.democraticunderground.com";

    $("td.title").each(function(i, element) {
      
      leftResults.title = $(element).children().text();
      leftResults.link = linkStart + $(element).children().attr("href");
      leftResults.time = $(element).next().next().next().text();
      leftResults.left = true;
      leftResults.right = false;
  
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
  res.redirect('/scrape/right');
});

app.get("/scrape/right", function(req, res) {
  // connect to the right-leaning discussion board Free Republic
  request("http://www.freerepublic.com/tag/breaking-news/index?tab=articles", function(err, response, html) {
    
    var $ = cheerio.load(html);
  
    var rightResults = {};

    var linkStart = "http://www.freerepublic.com/";
  
    $("li.article").each(function(i, element) {
  
      rightResults.link = linkStart + $(element).find("h3").children().attr("href");
      rightResults.title = $(element).find("h3").children().text();
      rightResults.time = $(element).find(".date").text();
      rightResults.left = false;
      rightResults.right = true;
      
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
  res.redirect('/all');
});

app.get("/scrape/news/center", function(req, res) {
  request("http://www.bbc.com/news/world/us_and_canada", function(error, response, html) {

  });
});

// END ROUTES //

// Open and listen to port //
app.listen(PORT, function() {
  if (PORT === 8080) {
    console.log("SHHH! We're listening on port: " + PORT);
    console.log("Go to http://localhost:" + PORT);
    console.log("Please make sure to visit and star my repo at https://github.com/JimGray9999/cheery-scrapio");
  } else {
    console.log("Please make sure to visit and star my repo at https://github.com/JimGray9999/cheery-scrapio");
  }
});
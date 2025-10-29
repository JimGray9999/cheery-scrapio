/* SERVER FOR THE APPLICATION */
/******************************/

// Load environment variables
require('dotenv').config();

// dependencies
var express = require("express");
var expresshbs = require("express-handlebars");
var cheerio = require("cheerio");
var axios = require("axios");
var mongoose = require("mongoose");
var helmet = require("helmet");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise; 

// database models
var Note = require("./models//Note");
var Article = require("./models/Article");

var app = express();
// Port configuration from environment
var PORT = process.env.PORT || 5000;


// Set Handlebars as the default templating engine.
app.engine("handlebars", expresshbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Security middleware
app.use(helmet());

// Make public a static dir
app.use(express.static("public"));

// Body parsing middleware (built into Express)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Database configuration with mongoose
// SECURITY: Database credentials now loaded from environment variables
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/cheery-scrapio");
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
    res.render("index");
});

app.get("/right", function(req, res) {
    // grab all right-learning articles
    // return for the get request
    res.render("index");
});

// run requests to add articles to the db
app.get("/scrape/left", async function(req, res) {
  try {
    // connect to the left-leaning discussion board Democratic Underground
    const response = await axios.get(process.env.SCRAPE_URL_LEFT || "https://www.democraticunderground.com/?com=forum&id=1014");
    const $ = cheerio.load(response.data);

    var leftResults = {};

    var linkStart = "https://www.democraticunderground.com";

    $("td.title").each(function(i, element) {

      leftResults.title = $(element).children().text();
      leftResults.link = linkStart + $(element).children().attr("href");
      leftResults.time = $(element).next().next().next().text();
      leftResults.left = true;
      leftResults.right = false;
      leftResults.source = "Democratic Underground";

      var newArticle = new Article(leftResults);

      newArticle.save(function(err, doc) {
        if(err) {
          console.log(err);
        } else {
          // console.log(doc); // link for testing purposes, comment out when not in use
        };
      });
    });
    console.log("Left links scraped!");
    res.redirect('/scrape/right');
  } catch (error) {
    console.error("Error scraping left links:", error.message);
    res.status(500).send("Error scraping left links");
  }
});

app.get("/scrape/right", async function(req, res) {
  try {
    // connect to the right-leaning discussion board Free Republic
    const response = await axios.get(process.env.SCRAPE_URL_RIGHT || "http://www.freerepublic.com/tag/breaking-news/index?tab=articles");
    const $ = cheerio.load(response.data);

    var rightResults = {};

    var linkStart = "http://www.freerepublic.com/";

    $("li.article").each(function(i, element) {

      rightResults.link = linkStart + $(element).find("h3").children().attr("href");
      rightResults.title = $(element).find("h3").children().text();
      rightResults.time = $(element).find(".date").text();
      rightResults.left = false;
      rightResults.right = true;
      rightResults.source = "Free Republic";

      var newArticle = new Article(rightResults);

      newArticle.save(function(err, doc) {
        if(err) {
          console.log(err);
        } else {
          // console.log(doc); // link for testing purposes, comment out when not in use
        };
      });
    });
    console.log("Right links scraped!");
    res.redirect('/all');
  } catch (error) {
    console.error("Error scraping right links:", error.message);
    res.status(500).send("Error scraping right links");
  }
});

app.get("/scrape/news/center", async function(req, res) {
  try {
    // TODO: Implement BBC scraping
    const response = await axios.get(process.env.SCRAPE_URL_CENTER || "http://www.bbc.com/news/world/us_and_canada");
    // Add scraping logic here
    res.send("BBC scraping not yet implemented");
  } catch (error) {
    console.error("Error scraping BBC:", error.message);
    res.status(500).send("Error scraping BBC");
  }
});

// END ROUTES //

// Open and listen to port //
app.listen(PORT, function() {
    console.log("SHHH! We're listening on port: " + PORT);
    console.log("Go to http://localhost:" + PORT);
    console.log("Please make sure to visit and star my repo at https://github.com/JimGray9999/cheery-scrapio");
});
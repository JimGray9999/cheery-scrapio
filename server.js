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


app.use(bodyParser.urlencoded({
  extended: false
}));

// ROUTES //
// TODO: build routes for the application
  // Grab all scraped links
  // Show articles only based on bias
  // add notes to a specific article
app.get("/", function(req, res) {
  res.render("index");
})

app.get("/left", function(req, res) {

});

app.get("/right", function(req, res) {

});

app.get("/center", function(req, res) {

});

// END ROUTES //

// REQUESTS //

// connect to the left-leaning discussion board Democratic Underground
request("https://www.democraticunderground.com/?com=forum&id=1014", function(err, response, html) {

  var $ = cheerio.load(html);

  var leftResults = [];

  var linkStart = "https://www.democraticunderground.com";

  // right sites:
  // http://www.freerepublic.com/tag/breaking-news/index?tab=articles
  // http://www.foxnews.com/

  // left sites:
  // https://www.nytimes.com/
  // https://www.democraticunderground.com/?com=forum&id=1014
  

  $("td.title").each(function(i, element) {

    var newsTitle = $(element).children().text();
    var link = linkStart + $(element).children().attr("href");
    var bias = "left";

    leftResults.push({
      title: newsTitle,
      link: link,
      bias: bias
    });    
  });
});
// connect to the right-leaning discussion board Free Republic
request("http://www.freerepublic.com/tag/breaking-news/index?tab=articles", function(err, response, html) {
  
    var $ = cheerio.load(html);
  
    var rightResults = [];

    var linkStart = "http://www.freerepublic.com/";
  
    $("li.article").each(function(i, element) {
  
      var link = linkStart + $(element).find("h3").children().attr("href");
      var newsTitle = $(element).find("h3").children().text();
      var bias = "right";
  
      rightResults.push({
        title: newsTitle,
        link: link,
        bias: bias
      });
      
    });
  });

// TODO: add requests for Fox News(Right), NY Times(Left), BBC(Center)

// END REQUESTS //

// Open and listen to port //
app.listen(PORT, function() {
  console.log("SHHH! We're listening on port: " + PORT);
  console.log("Go to http://localhost:" + PORT);
  console.log("Please make sure to visit and star my repo at https://github.com/JimGray9999/cheery-scrapio");
});
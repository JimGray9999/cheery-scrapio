// todo: setup server for express app
// need to scrape websites...can it be done by submitting a webpage?
// might be easier to provide a list...but start with one for now (all sides, and pick your bias)

var express = require("express");
var expresshbs = require("express-handlebars");

var cheerio = require("cheerio");
var request = require("request");

var app = express();

var PORT = 3000;

// Set Handlebars as the default templating engine.
app.engine("handlebars", expresshbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// TODO: have the request function fill the leftResults array with links from the left bias
// TODO: have the request function work the same for center and right bias links
// request("https://www.democraticunderground.com/?com=forum&id=1014", function(err, response, html) {

//   var $ = cheerio.load(html);

//   var leftResults = [];

//   var linkStart = "https://www.democraticunderground.com";

//   // TODO: make code DRY to check for left and right biased news/message board
//   // TODO list:
//   // Left scrapes: Democratic Underground, NY Times 
//   // Right scrapes: Free Republic, Fox News

//   // right sites:
//   // http://www.freerepublic.com/tag/breaking-news/index?tab=articles
//   // http://www.foxnews.com/

//   // left sites:
//   // https://www.nytimes.com/
//   // https://www.democraticunderground.com/?com=forum&id=1014
  

//   $("td.title").each(function(i, element) {

//     var newsTitle = $(element).children().text();
//     var link = linkStart + $(element).children().attr("href");
//     var bias = "left";

//     leftResults.push({
//       title: newsTitle,
//       link: link,
//       bias: bias
//     });
    
//   });

//   console.log(leftResults);
// });

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
  
    console.log(rightResults);
  });

app.listen(PORT, function() {
  console.log("SHHH! We're listening on port: " + PORT);
  console.log("Go to http://localhost:" + PORT);
  console.log("Please make sure to visit and star my repo at https://github.com/JimGray9999/cheery-scrapio");
});
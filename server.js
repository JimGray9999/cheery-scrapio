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

// Filter and show only left-leaning articles
app.get("/left", async function(req, res) {
  try {
    const articles = await Article.find({ left: true }).sort({ _id: -1 });
    res.render("index", { article: articles });
  } catch (error) {
    console.error("Error fetching left articles:", error.message);
    res.status(500).send("Error loading articles");
  }
});

// Filter and show only right-leaning articles
app.get("/right", async function(req, res) {
  try {
    const articles = await Article.find({ right: true }).sort({ _id: -1 });
    res.render("index", { article: articles });
  } catch (error) {
    console.error("Error fetching right articles:", error.message);
    res.status(500).send("Error loading articles");
  }
});

// run requests to add articles to the db
app.get("/scrape/left", async function(req, res) {
  try {
    // connect to the left-leaning discussion board Democratic Underground
    const response = await axios.get(process.env.SCRAPE_URL_LEFT || "https://www.democraticunderground.com/?com=forum&id=1014");
    const $ = cheerio.load(response.data);

    const linkStart = "https://www.democraticunderground.com";
    const articles = [];
    let newCount = 0;
    let duplicateCount = 0;

    // Collect all article data
    $("td.title").each(function(i, element) {
      const title = $(element).children().text();
      const link = linkStart + $(element).children().attr("href");
      const time = $(element).next().next().next().text();

      if (title && link) {
        articles.push({
          title: title,
          link: link,
          time: time,
          left: true,
          right: false,
          source: "Democratic Underground"
        });
      }
    });

    // Save articles with duplicate detection
    for (const articleData of articles) {
      const existing = await Article.findOne({ link: articleData.link });
      if (!existing) {
        const newArticle = new Article(articleData);
        await newArticle.save();
        newCount++;
      } else {
        duplicateCount++;
      }
    }

    console.log(`Left links scraped! New: ${newCount}, Duplicates skipped: ${duplicateCount}`);
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

    const linkStart = "http://www.freerepublic.com/";
    const articles = [];
    let newCount = 0;
    let duplicateCount = 0;

    // Collect all article data
    $("li.article").each(function(i, element) {
      const link = linkStart + $(element).find("h3").children().attr("href");
      const title = $(element).find("h3").children().text();
      const time = $(element).find(".date").text();

      if (title && link) {
        articles.push({
          link: link,
          title: title,
          time: time,
          left: false,
          right: true,
          source: "Free Republic"
        });
      }
    });

    // Save articles with duplicate detection
    for (const articleData of articles) {
      const existing = await Article.findOne({ link: articleData.link });
      if (!existing) {
        const newArticle = new Article(articleData);
        await newArticle.save();
        newCount++;
      } else {
        duplicateCount++;
      }
    }

    console.log(`Right links scraped! New: ${newCount}, Duplicates skipped: ${duplicateCount}`);
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

// NOTE/COMMENT ROUTES //

// Get an article and its note by article ID
app.get("/articles/:id", async function(req, res) {
  try {
    const article = await Article.findById(req.params.id).populate("note");
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(article);
  } catch (error) {
    console.error("Error fetching article:", error.message);
    res.status(500).json({ error: "Error fetching article" });
  }
});

// Create or update a note for an article
app.post("/articles/:id", async function(req, res) {
  try {
    const { header, text } = req.body;

    // Validate input
    if (!header || !text) {
      return res.status(400).json({ error: "Header and text are required" });
    }

    // Create the note
    const newNote = new Note({
      header: header,
      text: text
    });

    const savedNote = await newNote.save();

    // Update the article with the note reference
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { note: savedNote._id },
      { new: true }
    ).populate("note");

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({ success: true, article: article });
  } catch (error) {
    console.error("Error saving note:", error.message);
    res.status(500).json({ error: "Error saving note" });
  }
});

// Delete a note from an article
app.delete("/articles/:id/note", async function(req, res) {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    if (article.note) {
      // Delete the note
      await Note.findByIdAndDelete(article.note);

      // Remove the note reference from the article
      article.note = null;
      await article.save();
    }

    res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    console.error("Error deleting note:", error.message);
    res.status(500).json({ error: "Error deleting note" });
  }
});

// END ROUTES //

// Open and listen to port //
app.listen(PORT, function() {
    console.log("SHHH! We're listening on port: " + PORT);
    console.log("Go to http://localhost:" + PORT);
    console.log("Please make sure to visit and star my repo at https://github.com/JimGray9999/cheery-scrapio");
});
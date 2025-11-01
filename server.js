/* SERVER FOR THE APPLICATION */
/******************************/

// Load environment variables
require('dotenv').config();

// dependencies
var express = require("express");
var { engine } = require("express-handlebars");
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
var PORT = process.env.PORT || 3000;

// Axios HTTP client with sensible defaults to avoid hangs/blocks during scraping
var httpClient = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; cheery-scrapio/1.0; +https://github.com/JimGray9999/cheery-scrapio)"
  },
  maxRedirects: 5
});

// Global error handlers to avoid process exit on unexpected errors
process.on("unhandledRejection", function(reason) {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", function(err) {
  console.error("Uncaught Exception:", err);
});


// Set Handlebars as the default templating engine.
app.engine("handlebars", engine({ defaultLayout: "main" }));
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

app.get("/all", async function(req, res) {
  try {
    var articles = await Article.find({}).lean();
    res.render("index", { article: articles });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading articles");
  }
})

app.get("/", function(req, res) {
  res.render("index");
});

// TODO: Filter and show only the selected bias
app.get("/left", async function(req, res) {
  try {
    var leftArticles = await Article.find({ left: true }).lean();
    res.render("index", { article: leftArticles });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading left articles");
  }
});

app.get("/right", async function(req, res) {
  try {
    var rightArticles = await Article.find({ right: true }).lean();
    res.render("index", { article: rightArticles });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading right articles");
  }
});

// run requests to add articles to the db
app.get("/scrape/left", async function(req, res) {
  try {
    // connect to the left-leaning discussion board Democratic Underground
    const response = await httpClient.get(process.env.SCRAPE_URL_LEFT || "https://www.democraticunderground.com/?com=forum&id=1014");
    const $ = cheerio.load(response.data);

    var linkStart = "https://www.democraticunderground.com";

    // Collect docs to save (avoid async in cheerio.each directly)
    var docsToUpsert = [];

    // Prefer explicit post links for DU forum 1014
    var primaryAnchors = $("a[href*='?com=view_post'][href*='forum=1014']");
    var fallbackAnchors = $("td.subject a, td.title a");
    if(primaryAnchors.length === 0) {
      var broadAnchors = $("a").filter(function(i, el){
        var href = $(el).attr("href") || "";
        return href.includes("?com=view_post") || href.includes("?com=discuss") || href.includes("?com=thread");
      });
      fallbackAnchors = fallbackAnchors.add(broadAnchors);
    }

    console.log("DU selector debug:", {
      primaryCount: primaryAnchors.length,
      fallbackCount: fallbackAnchors.length,
      samplePrimary: primaryAnchors.slice(0,5).map(function(i, el){ return $(el).attr("href"); }).get(),
      sampleFallback: fallbackAnchors.slice(0,5).map(function(i, el){ return $(el).attr("href"); }).get()
    });

    var anchorsToUse = primaryAnchors.length > 0 ? primaryAnchors : fallbackAnchors;

    anchorsToUse.each(function(i, element) {
      var href = $(element).attr("href");
      var title = $(element).text().trim();
      if(!href || !title) { return; }
      if(title.toLowerCase().includes("view all")) { return; }
      var link = href.startsWith("http") ? href : linkStart + href;
      var row = $(element).closest("tr");
      var timeText = row.find("td.time").text().trim() || row.find("td:nth-child(4)").text().trim() || "";

      docsToUpsert.push({
        updateOne: {
          filter: { link: link },
          update: {
            $set: {
              title: title,
              link: link,
              time: timeText,
              left: true,
              right: false,
              source: "Democratic Underground"
            }
          },
          upsert: true
        }
      });
    });

    if(docsToUpsert.length > 0) {
      await Article.bulkWrite(docsToUpsert, { ordered: false });
    }
    console.log("Left items attempted to upsert:", docsToUpsert.length);
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
    const response = await httpClient.get(process.env.SCRAPE_URL_RIGHT || "http://www.freerepublic.com/tag/breaking-news/index?tab=articles");
    const $ = cheerio.load(response.data);

    var linkStart = "http://www.freerepublic.com/";
    var savedRight = 0;

    // Collect all article data
    $("li.article").each(function(i, element) {
      var rightResults = {
        link: linkStart + $(element).find("h3").children().attr("href"),
        title: $(element).find("h3").children().text(),
        time: $(element).find(".date").text(),
        left: false,
        right: true,
        source: "Free Republic"
      };

      var newArticle = new Article(rightResults);
      newArticle.save().then(function(){ savedRight++; }).catch(function(err) { console.log(err); });
    });
    console.log("Right items attempted to save:", savedRight);
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
    const response = await httpClient.get(process.env.SCRAPE_URL_CENTER || "http://www.bbc.com/news/world/us_and_canada");
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

// Debug counts route
app.get("/debug/counts", async function(req, res) {
  try {
    var leftCount = await Article.countDocuments({ left: true });
    var rightCount = await Article.countDocuments({ right: true });
    var total = await Article.countDocuments({});
    res.json({ total: total, left: leftCount, right: rightCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Open and listen to port //
app.listen(PORT, function() {
    console.log("SHHH! We're listening on port: " + PORT);
    console.log("Go to http://localhost:" + PORT);
    console.log("Please make sure to visit and star my repo at https://github.com/JimGray9999/cheery-scrapio");
});
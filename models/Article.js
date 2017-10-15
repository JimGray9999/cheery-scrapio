var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  left: {
    type: Boolean,
    required: true,
  },
  right: {
    type: Boolean,
    required: true,
  }, 
  source: {
    type: String,
    required: true
  },
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note",
    required: false
  }
});

var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
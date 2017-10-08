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
  bias: {
    type: String,
    required: true,
    validate: [
      function(input) {
        return (input === "left" || input === "neutral" || input === "right");
      },
      "Need to declare a bias for the article (Left, Neutral or Right)"
    ]
  }, 
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
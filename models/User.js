// TODO: create users to leave comments

var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var UserSchema = new Schema({ 
  name: {
    type: String,
    required: true
  },
  Location: {
    type: String,
    required: false
  },
  bias: {
    type: String,
    required: true,
    validate: [
      function(input) {
        return (input === "left" || input === "center" || input === "right");
      },
      "Need to declare a bias for the user (Left, Center, or Right)"
    ]
  }
  // TODO: link to list of notes the user posted
});

var User = mongoose.model("User", UserSchema);

exports.module = User;


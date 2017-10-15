var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var NoteSchema = new Schema ({
  header: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  }
});

var Note = mongoose.model("Note", NoteSchema);

exports.module = Note;
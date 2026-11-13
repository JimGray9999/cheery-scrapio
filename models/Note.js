const mongoose = require('mongoose');

const { Schema } = mongoose;

const NoteSchema = new Schema(
  {
    header: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Note = mongoose.model('Note', NoteSchema);

module.exports = Note;

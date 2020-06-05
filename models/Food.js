const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const foodSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
  },
  mixed: {
    type: Boolean,
    default: true
    trim: true,
  }
  image: String,
  token: {
    type: String,
  },
  tokenExp: {
    type: Number,
  },
});

const Food = mongoose.model('Food', foodSchema);

module.exports = { User };

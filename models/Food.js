const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Joi = require('joi');

const foodSchema = mongoose.Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    price: {
      type: String,
      default: 0,
    },
    shop: {
      type: Number,
      default: 1,
    },
    image: {
      type: Array,
      default: [],
    },
    categories: {
      type: Number,
      default: 1,
    },
    sold: {
      type: Number,
      maxlength: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

foodSchema.index(
  {
    name: 'text',
    description: 'text',
  },
  {
    weights: {
      name: 5,
      description: 1,
    },
  }
);
const Food = mongoose.model('Food', foodSchema);
module.exports = { Food };

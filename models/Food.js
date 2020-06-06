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

const Food = mongoose.model('Food', foodSchema);

// function validateFood(food) {
//     const schema = {
//       SuggestionID: Joi.any().required(),
//       date: Joi.date(),
//       comment: Joi.string()
//         .min(3)
//         .required()
//     }

//     return Joi.validate(food, schema)
//   }

// exports.validate = validate
module.exports = { Food };

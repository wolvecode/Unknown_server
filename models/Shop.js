const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Joi = require('joi');

const shopSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
    trim: true,
  }

const Shop = mongoose.model('Shop', shopSchema);

module.exports = { Shop };

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT,
  localhost: 'mongodb://localhost/unknown',
};

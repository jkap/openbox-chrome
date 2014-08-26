'use strict';

var Joi = require('joi');

module.exports = {
  entry: {
    body: {
      location: Joi.string().required(),
      sku: Joi.string().regex(/\d+/).required()
    }
  }
};

'use strict';

var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var bluebird = require('bluebird');
var bestbuy = bluebird.promisifyAll(require('bestbuy'));
var _ = require('lodash');
var url = require('url');
var validate = require('express-validation');
var validation = require('./validations');

var app = express();

app.use(require('morgan')('dev'));
app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded());

function getStores(coords, page) {
  return bestbuy.storesAsync('area(' + coords + ',25)', {
    show: 'storeId,name,lat,lng,distance',
    page: page
  });
}

function allowCrossDomain(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.set('Access-Control-Allow-Headers', 'content-type, accept');

  next();
}

app.post('/entry', allowCrossDomain, validate(validation.entry), function (req, res) {
  bluebird.all([
    bestbuy.productsAsync(+req.body.sku, {
      show: 'url,sku'
    }),
    getStores(req.body.location, 1).then(function (results) {
      var promises = [];

      function concatStores(stores) {
        results.stores = results.stores.concat(stores.stores);
      }

      if (results.totalPages > 1) {
        for (var i = 2; i <= results.totalPages; i += 1) {
          promises.push(getStores(req.body.location, i).then(concatStores));
        }
      }

      return bluebird.all(promises).then(function () {
        return _.sortBy(results.stores, 'distance');
      });
    })
  ]).spread(function (product, stores) {
    return {
      sku: product.sku,
      baseUrl: url.parse(product.url, true),
      stores: _.indexBy(stores, 'storeId')
    };
  }).then(function (result) {
    var storeIds = _.pluck(result.stores, 'storeId').join(',');

    return bestbuy.openBoxProductsAsync('storeId in(' + storeIds + ')&sku=' + result.sku).then(function (results) {
      return bluebird.all(_.map(results.openBoxProducts, function (product) {
        var productUrl = _.extend(result.baseUrl);
        productUrl.query.dnmId = 'o_' + product.licensePlate;
        productUrl.query.ld = result.stores[product.storeId].lat;
        productUrl.query.lg = result.stores[product.storeId].lng;
        delete productUrl.search;
        return {
          store_name: result.stores[product.storeId].name,
          openbox_url: url.format(productUrl),
          store_id: product.storeId
        };
      }));
    }, function (err) {
      console.warn(err);
    });
  }).then(function (results) {
    res.json(results);
  }).catch(function (err) {
    console.warn(err);
  });
});

app.listen(3000);

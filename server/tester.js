/*jslint node:true*/
'use strict';

var bluebird = require('bluebird');
var bestbuy = bluebird.promisifyAll(require('bestbuy').init('qr66hbckdsrfyqedhxff3x4e'));
var _ = require('lodash');
var prompt = bluebird.promisifyAll(require('prompt'));
var url = require('url');

prompt.start();

prompt.getAsync(['sku', 'zipCode']).then(function (result) {
  return bluebird.all([
    bestbuy.productsAsync(+result.sku, {
      show: 'url,sku'
    }),
    bestbuy.storesAsync('area(' + result.zipCode + ',25)', {
      show: 'storeId,name,lat,lng'
    })
  ]).spread(function (product, stores) {
    stores = stores.stores;
    return {
      sku: product.sku,
      baseUrl: url.parse(product.url, true),
      stores: _.indexBy(stores, 'storeId')
    };
  });
}).then(function (result) {
  var storeIds = _.pluck(result.stores, 'storeId').join(',');

  bestbuy.openBoxProductsAsync('storeId in(' + storeIds + ')&sku=' + result.sku).then(function (results) {
    _.forEach(results.openBoxProducts, function (product) {
      var productUrl = _.extend(result.baseUrl);
      productUrl.query.dnmId = 'o_' + product.licensePlate;
      productUrl.query.ld = result.stores[product.storeId].lat;
      productUrl.query.lg = result.stores[product.storeId].lng;
      delete productUrl.search;
      console.log(product.storeId);
      console.log(url.format(productUrl));
    });
  }, function (err) {
    console.warn(err);
  });
});

/*globals chrome*/
(function (jQuery) {
  'use strict';

  function getData(location) {
    jQuery.post('http://46bd1be9.ngrok.com/entry', {
      location: '' + location,
      sku: '' + sku
    }, function (data) {
      $('#priceblock-wrapper-wrapper').append($('<b />', {
        text: 'Open Box'
      }), $('<br>'));
      data.forEach(function (product) {
        $('#priceblock-wrapper-wrapper').append($('<a />', {
          text: product.store_name,
          href: product.openbox_url
        }), '<br />');
      });
    });
  }

  if (document.location.pathname.match(/(\d{7})\.p$/)) {
    var sku = document.location.pathname.match(/(\d{7})\.p$/)[1];

    chrome.storage.sync.get('zipCode', function (data) {
      if (data.zipCode) {
        getData(data.zipCode);
      } else {
        navigator.geolocation.getCurrentPosition(function (pos) {
          getData('' + pos.coords.latitude + ',' + pos.coords.longitude);
        });
      }
    });
  }
}(window.jQuery));

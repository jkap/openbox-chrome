/*globals chrome*/

(function () {
  'use strict';
  function saveOptions() {
    var zipCode = document.getElementById('zipCode').value;
    chrome.storage.sync.set({
      zipCode: zipCode
    });
  }

  function restoreOptions() {
    chrome.storage.sync.get({
      zipCode: ''
    }, function (items) {
      document.getElementById('zipCode').value = items.zipCode;
    });
  }

  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);
}());

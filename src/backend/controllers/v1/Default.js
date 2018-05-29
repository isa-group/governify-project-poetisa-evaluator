'use strict';

var utils = require('../../utils/writer.js');
var Default = require('../../service/DefaultService');

module.exports.getBilling = function getBilling(req, res, next) {
  var rules = req.swagger.params['rules'].value;
  Default.getBilling(rules)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
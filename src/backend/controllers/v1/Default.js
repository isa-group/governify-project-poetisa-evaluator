'use strict';

var utils = require('../../utils/writer.js');
var Default = require('../../service/DefaultService');

module.exports.evaluate = function evaluate(req, res, next) {
  var rules = req.swagger.params['rules'].value;
  Default.evaluate(rules)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
"use strict";

require("colors");

const request = require("request");
const Promise = require("bluebird");
const Engine = require("json-rules-engine").Engine;

const logger = require("../logger");
const influx = require('./Influx');

/**
 * Return..
 *
 * rules Data json of rules
 * returns Data
 **/
exports.getBilling = function (rules) {
  return new Promise(function (resolve, reject) {
    // var engine = new Engine();
    var options = {
      allowUndefinedFacts: true
    };
    var engine = new Engine([], options);

    engine.on("success", (event, almanac) => {
      logger.info("System" + " have ".green + "....." + event.type.underline + " " + event.params.message);
      logger.info("REWARD: " + event.params.value);
    });
    engine.on("failure", event => {
      logger.info("System" + " haven´t ".red + " ..... " + event.type.underline + " " + event.params.message);
    });
    rules.rules.forEach(newRule => {
      logger.info("New rule: " + JSON.stringify(newRule));
      engine.addRule(newRule);
    });

    buildFacts(rules.metrics, rules.from, rules.to).then(newMetric => {
      logger.info("metrics: " + JSON.stringify(newMetric));

      engine.run(newMetric).then(event => {
        getResults(event, rules.from, rules.to).then(result => {
          influx.writeInflux(result);
          return resolve(result);
        });
      });
    });
  });
};

/**
 *
 * @param {*} event
 */
function getResults(event, from, to) {
  return new Promise(function (resolve, reject) {
    var result = {
      from: from,
      to: to,
      percentage: 0,
      message: []
    };
    event.forEach(function (fact) {
      result.percentage += parseInt(fact.params.value);
      result.message.push(fact.params.message);
    });
    resolve(result);
  });
}

/**
 *
 * @param {*} metrics
 * @param {*} from
 * @param {*} to
 */
function buildFacts(metrics, from, to) {
  return new Promise(function (resolve, reject) {
    var newFact = '{ "reward": 0 ';
    var apiResult = [];
    metrics.forEach(newMetric => {
      apiResult.push(
        new Promise((resolve, reject) => {
          logger.info("newMetric: " + JSON.stringify(newMetric));
          var name = newMetric.name;
          getApi(newMetric.url, from, to).then(value => {
            newFact = newFact + ', "' + name + '" : ' + value;
            logger.info("facts: " + newFact);
            resolve(newFact);
          });
        })
      );
    });
    Promise.all(apiResult).then(value => {
      value = newFact + "}";
      value = JSON.parse(value);
      resolve(value);
    });
  });
}

/**
 *
 * @param {*} url
 * @param {*} from
 * @param {*} to
 */
function getApi(url, from, to) {
  return new Promise(function (resolve, reject) {
    var myUrl = url.split("&")[0];
    if (!!url.split("&")[1]) {
      myUrl += "?from=" + from + "&" + url.split("&")[1];
    } else {
      myUrl += "?from=" + from;
    }
    if (to) {
      myUrl = myUrl + "&to=" + to;
    }
    logger.info("URL: " + myUrl);
    request({
        method: "GET",
        url: myUrl,
        json: true
      },
      (err, res, body) => {
        if (err) {
          logger.info("GET <" + url + "> : " + err);
          reject(err);
        }
        logger.info("URL GET: " + myUrl);
        if (body.response.value) {
          resolve(body.response.value);
        } else {
          resolve(body.response);
        }
      }
    );
  });
}
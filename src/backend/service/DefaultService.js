"use strict";

require("colors");

const request = require("request");
const Promise = require("bluebird");
const Engine = require("json-rules-engine").Engine;

const logger = require("../logger");


/**
 * Return..
 *
 * rules Data json of rules
 * returns Data
 **/
exports.getBilling = function (rules) {
  return new Promise(function (resolve, reject) {
    var engine = new Engine();
    var examples = {};

    // if (Object.keys(examples).length > 0) {
    //   resolve(examples[Object.keys(examples)[0]]);
    engine.on("success", (event, almanac) => {
      logger.info("System" + " have ".green + "....." + event.type.underline + " " + event.params.message);
      // if (event.type == "increment-fact") {
      //   almanac.factMap.get(event.params.fact).value = almanac.factMap.get(event.params.fact).value + event.params.value;
      // almanac.factMap.set(event.params.fact, aux);
      // result.billing = almanac.factMap.get(event.params.fact).value;
      // result.messages.push(event.type + ' - ' + event.params.message);
      logger.info('REWARD: ' + event.params.value);
      // }
    });
    engine.on('failure', event => {
      logger.info('System' + ' haven´t '.red + ' ..... ' + event.type.underline + ' ' + event.params.message);
    });
    rules.rules.forEach(newRule => {
      logger.info('New rule: ' + JSON.stringify(newRule));
      engine.addRule(newRule);
    });

    buildFacts(rules.metrics, rules.from, rules.to).then(newMetric => {
      logger.info("metrics: " + JSON.stringify(newMetric));
      engine.run(newMetric).then((event) => {
        getResults(event).then(result => {
          return resolve(result);
        });
      });
    });
  });
};

function getResults(event) {
  return new Promise(function (resolve, reject) {
    var result = {
      reward: 0,
      penalties: 0,
      message: []
    };
    event.forEach(function (fact) {
      switch (fact.type) {
        case ("decrement-fact"):
          result.reward += fact.params.value;
          result.message.push(fact.params.message)
          break;
        case ("increment-fact"):
          result.penalties += fact.params.value;
          result.message.push(fact.params.message)
          break;
        case ("commitment"):
          result.message.push(fact.params.message);
          break;
        default:
          break;
      }
    });
    resolve(result);
  });

}

function buildFacts(metrics, from, to) {
  return new Promise(function (resolve, reject) {
    var newFact = '{ "reward": 0 ';
    var apiResult = [];
    metrics.forEach(newMetric => {
      apiResult.push(
        new Promise((resolve, reject) => {
          logger.info('newMetric: ' + JSON.stringify(newMetric));
          var name = newMetric.name;
          getApi(newMetric.url, from, to).then(value => {
            newFact = newFact + ', "' + name + '" : ' + value;
            logger.info("facts: " + newFact);
            resolve(newFact);
          });
        }));
    });
    Promise.all(apiResult).then(value => {
      value = value[value.length - 1] + '}';
      value = JSON.parse(value);
      resolve(value);
    });
  });
}

function getApi(url, from, to) {
  return new Promise(function (resolve, reject) {
    var myUrl = url + "?from=" + from;
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
          logger.info(err);
          reject(err);
        }
        // logger.info(res.statusCode);
        if (body.response.value) {
          resolve(body.response.value);
        } else {
          resolve(body.response);
        }
      }
    );
  });
}
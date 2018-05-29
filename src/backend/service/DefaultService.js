"use strict";

require("colors");

const request = require("request");
const Promise = require("bluebird");
const Engine = require("json-rules-engine").Engine;


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
    examples["application/json"] = {
      from: "2000-01-23",
      rules: [{
          conditions: {
            all: [{
                fact: "fact",
                value: "value",
                operator: "operator"
              },
              {
                fact: "fact",
                value: "value",
                operator: "operator"
              }
            ]
          },
          event: {
            params: "params",
            type: "type"
          }
        },
        {
          conditions: {
            all: [{
                fact: "fact",
                value: "value",
                operator: "operator"
              },
              {
                fact: "fact",
                value: "value",
                operator: "operator"
              }
            ]
          },
          event: {
            params: "params",
            type: "type"
          }
        }
      ],
      metrics: [{
          name: "name",
          id: 0,
          url: "url"
        },
        {
          name: "name",
          id: 0,
          url: "url"
        }
      ],
      to: "2000-01-23"
    };
    // if (Object.keys(examples).length > 0) {
    //   resolve(examples[Object.keys(examples)[0]]);
    var newFact = {};
    engine.on("success", (event, almanac) => {
      console.log("System" + " have ".green + "....." + event.type.underline + " " + event.params.message);
      if (event.type == "incremment-fact") {
        almanac.factMap.get(event.params.fact).value = almanac.factMap.get(event.params.fact).value + event.params.value;
        // almanac.factMap.set(event.params.fact, aux);
        // result.billing = almanac.factMap.get(event.params.fact).value;
        // result.messages.push(event.type + ' - ' + event.params.message);
        console.log('REWARD: ' + almanac.factMap.get(event.params.fact).value);
      }
    })
    engine.on('failure', event => {
      console.log('System' + ' haven´t '.red + ' ..... ' + event.type.underline + ' ' + event.params.message);
    });
    rules.rules.forEach(newRule => {
      console.log('newRule ' + JSON.stringify(newRule));
      engine.addRule(newRule);
    });
    rules.metrics
      .forEach(newMetric => {
        console.log('newMetric ' + JSON.stringify(newMetric));
        var name = newMetric.name;
        var api = getApi(newMetric.url, rules.from, rules.to).then(value => {
          newFact = JSON.parse('{ "reward": 0, "' + name + '": ' + value + '}');
          console.log("newFact: " + JSON.stringify(newFact));
          var reward = 0;
          engine.run(newFact).then((event) => {
            let result = {
              reward: 0,
              message: []
            };
            event.forEach(function (fact) {
              result.reward += fact.params.value;
              result.message.push(fact.params.message);
            })
            return resolve(result);
          });
        });
      });
  });
};

function getApi(url, from, to) {
  return new Promise(function (resolve, reject) {
    var myUrl = url + "?from=" + from;
    if (to) {
      myUrl = myUrl + "&to=" + to;
    }
    request({
        method: "GET",
        url: myUrl,
        json: true
      },
      (err, res, body) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        // console.log(res.statusCode);
        resolve(body.response.value);
      }
    );
  });
}
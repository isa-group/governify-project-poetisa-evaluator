"use strict";

require("colors");

const Promise = require("bluebird");
const Influx = require("influx");
const logger = require("../logger");
const config = require("../configurations");

var measurementBilling = "billing";

exports.writeInflux = function (dataBilling) {
    var data = {
        from: dataBilling.from,
        to: dataBilling.to,
        result: dataBilling.percentage
    };
    logger.info("data");
    connectAndCreateInfluxDB(data);
};

var influx;

function connectAndCreateInfluxDB(data) {
    return new Promise(function (resolve, reject) {
        console.log("Creating influxdb connection to %s", config.data.hostInflux);
        influx = new Influx.InfluxDB({
            host: config.data.hostInflux,
            port: config.data.portInflux,
            database: "k8s"
        });
        // Set up influx database

        influx;

        checkMeasurement().then(exist => {
            return new Promise(function (reject, resolve) {
                if (!exist) {
                    logger.info("Exist measurement");
                    influx.writeMeasurement("billing", [{
                        fields: {
                            from: data.from,
                            to: data.to,
                            executeTime: new Date().toISOString(),
                            value: data.result
                        }
                    }]);
                } else {
                    functionInsertData(data);
                }
            });
        });
    });
}

function checkMeasurement() {
    return new Promise(function (resolve, reject) {
        var exist = false;
        influx.getMeasurements().then(names => {
            if (names === "Billing") {
                exist = true;
            }
            console.log("My database has this measurements and names are: " + names.join(", "));
        });
        return resolve(exist);
    });
};


function functionInsertData(data) {
    influx = new Influx.InfluxDB({
        host: config.data.hostInflux,
        port: config.data.portInflux,
        database: "k8s",
        schema: [{
            measurement: "billing",
            fields: {
                from: Influx.FieldType.STRING,
                to: Influx.FieldType.STRING,
                executeTime: Influx.FieldType.STRING,
                value: Influx.FieldType.INTEGER
            }
        }]
    });
    influx
        .writePoints(
            [{
                measurement: "billing",
                fields: {
                    from: data.from,
                    to: data.to,
                    executeTime: new Date().toISOString(),
                    value: data.result
                }
            }], {
                database: "k8s"
            }
        )
        .catch(error => {
            console.error(`Error saving data to InfluxDB! ${error.stack}`);
        });
}
'use strict';

let AWS = require("aws-sdk");
exports.handler = (event, context, callback) => {
    let emr = new AWS.EMR();
    let sns = new AWS.SNS();
    let response = {};

    const params = {
        ClusterId: event.detail.clusterId
    };

    let describeClusterPromise = emr.describeCluster(params).promise();
    describeClusterPromise.then((data) => {
        if (data.Cluster.SecurityConfiguration == null) {
            const params = {
                Message: 'No security configuration',
                Subject: 'No security configuration',
                TopicArn: process.env.TOPIC_ARN,
            };
            return sns.publish(params).promise();
        } else {
            return callback(null);
        }
    }).then((data) => {
        response = {
            statusCode: 200,
            body: JSON.stringify('Done!')
        };
        console.log("Done");
    }).catch((err) => {
        response = {
            statusCode: 200,
            body: JSON.stringify('Failed'),
        }
        console.log("Error: " + err);
    });

    return callback(null, response);
};
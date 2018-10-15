'use strict';

const AWS = require('aws-sdk');
const uuidV4 = require('uuid/v4');

exports.handler = (event, context, callback) => {
    const eventName = event.detail.name;
    let response = {};

    if (eventName.search(process.env.CLUSTER_NAME) === -1) {
        response = {
            statusCode: 400,
            body: JSON.stringify('Cluster name not found'),
        };
        callback(null, response);
        return;
    }

    let cloudwatchevents = new AWS.CloudWatchEvents();
    let params = {
        Name: uuidV4(),
        EventPattern: '{"source": ["aws.emr"],"detail-type": ["EMR Step Status Change"],"detail": {"clusterId": ["' + event.detail.clusterId +'"]}}',
        State: 'ENABLED',
    };

    let putRulePromise = cloudwatchevents.putRule(params).promise();
    putRulePromise.then((data) => {
        let params = {
            Rule: data.RuleArn.split("/")[1],
            Targets: [
                {
                    Arn: process.env.SNS_ARN,
                    Id: uuidV4(),
                },
            ]
        };

        return cloudwatchevents.putTargets(params).promise();
    }).then((data) => {
        console.log("Hello " +  data);
        response = {
            statusCode: 200,
            body: JSON.stringify('Done!'),
        };
    }).catch((err) => {
        console.log(err);
        response = {
            statusCode: 200,
            body: JSON.stringify('Failed'),
        }
    });

    callback(null, response);
};
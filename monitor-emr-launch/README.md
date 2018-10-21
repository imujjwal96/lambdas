CloudWatchEvents let users create Rules for EMR cluster for events including State Change and EMR Configuration Error. With the EMR State Change event, CWEvents let users pulbish notifications for the creation of EMR clusters, among other states. However, there are use cases where the customers might want to send notification on the launch of clusters with specific configurations. One such use case might be to check if the cluster created contains a Security Configuration.

Such a use case can be achieved through the following approach.
1. Create an SNS Topic that sends notifications.
2. Create a Lambda function using the script attached.
3. Specify the following Environment Variable to the lambda function
    * `TOPIC_ARN`: ARN of the SNS topic created in the first step.
4. Create a CloudWatch Event Rule with the following Event Pattern and set the Lambda function created in step 2 as its target. This CloudWatch event will trigger the lambda function whenever a new Cluster is created.


        // Event Pattern:
        {
          "source": [
            "aws.emr"
          ],
          "detail-type": [
            "EMR Cluster State Change"
          ],
          "detail": {
            "state": [
              "RUNNING"
            ]
          }
        }


        // Lambda Script:
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

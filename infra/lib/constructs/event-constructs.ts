import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';

interface EventsConstructProps {
    uploadBucket: s3.Bucket;
    hrTopic: sns.Topic;
}

export class EventsConstruct extends Construct {
    constructor(scope: Construct, id: string, props: EventsConstructProps) {
        super(scope, id);

        // Rule 1: All upload -> SNS
        const allUploadRule = new events.Rule(this, 'AllUploadRule', {
            ruleName: 'new-application-notification',
            eventPattern: {
                source: ['aws.s3'],
                detailType: ['Object Created'],
                detail: {
                    bucket: { name: [props.uploadBucket.bucketName] },
                    object: { key: [{ prefix: 'uploads/'}]},
                },
            },
        });

        allUploadRule.addTarget(new targets.SnsTopic(props.hrTopic))

        // Rule 2 PDF uploads -> dedicated log
        const pdfLogGroup = new logs.LogGroup(this, 'PdfEventsLog', {
            logGroupName: '/events/pdf-uploads',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_WEEK,
        })

        const pdfRule = new events.Rule(this, 'PdfUploadRule', {
            ruleName: 'pdf-upload-routing',
            eventPattern: {
                source: ['aws.s3'],
                detailType: ['Object Created'],
                detail: {
                    bucket: { name: [props.uploadBucket.bucketName]},
                    object: { key: [ { suffix: '.pdf'}]}
                },
            },
        })

        pdfRule.addTarget(new targets.CloudWatchLogGroup(pdfLogGroup))

        // Rule 3: JSON uploads -> dedicated log
        const jsonLogGroup = new logs.LogGroup(this, 'JsonEventsLog', {
            logGroupName: '/events/json-uploads',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_WEEK
        })

        const jsonRule = new events.Rule(this, 'JsonUploadsRule', {
            ruleName: 'json-upload-routing',
            eventPattern: {
                source: ['aws.s3'],
                detailType: ['Object Created'],
                detail: {
                    bucket: { name: [props.uploadBucket.bucketName]},
                    object: { key: [ { suffix: '.json'}]}
                }
            }
        })
        jsonRule.addTarget(new targets.CloudWatchLogGroup(jsonLogGroup))
    }
}

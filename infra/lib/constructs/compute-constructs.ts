import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3n from 'aws-cdk-lib/aws-s3-notifications'
import * as path from 'path'

interface ComputeConstructProps {
    applicationTable: dynamodb.Table;
    uploadBucket: s3.Bucket;
}

export class ComputeConstruct extends Construct {
    public readonly processUpload: nodejs.NodejsFunction;

    constructor(scope: Construct, id: string, props: ComputeConstructProps){
        super(scope, id)

        this.processUpload = new nodejs.NodejsFunction(this, "processUpload", {
            runtime: lambda.Runtime.NODEJS_24_X,
            entry: path.join(__dirname, '../lambdas/process-upload.ts'),
            handler: 'handler',
            timeout: cdk.Duration.seconds(30),
            bundling: {
                minify: true,
                sourceMap: true,
            },
            environment: {
                TABLE_NAME: props.applicationTable.tableName
            }
        })

        props.applicationTable.grantWriteData(this.processUpload)
        props.uploadBucket.grantRead(this.processUpload)

        props.uploadBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(this.processUpload),
            { prefix: 'uploads/'}
        )
    }
}
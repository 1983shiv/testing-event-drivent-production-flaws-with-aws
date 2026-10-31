import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3"

interface StorageConstructProps {
    webOrigin?: string;
}

export class StorageConstruct extends Construct{
    public readonly uploadBucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: StorageConstructProps = {}){
        super(scope, id);

        this.uploadBucket = new s3.Bucket(this, "UploadBucket", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            eventBridgeEnabled: true,
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.PUT],
                    allowedOrigins: [props.webOrigin || 'http://localhost:3000'],
                    allowedHeaders: ['content-type', 'x-amz-meta-*'],
                    exposedHeaders: ['ETag'],
                }
            ]
        })
    }
}
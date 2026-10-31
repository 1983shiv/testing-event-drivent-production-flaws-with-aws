import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"

export class DatabaseConstruct extends Construct{
    public readonly applicationsTable: dynamodb.Table;

    constructor(scope: Construct, id: string){
        super(scope, id);

        this.applicationsTable = new dynamodb.Table(this, 'ApplicationTable', {
            tableName: 'job-applications',
            partitionKey: {
                name: 'applicationId',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        })
    }
}
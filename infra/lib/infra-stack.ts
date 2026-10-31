import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

import { DatabaseConstruct } from './constructs/database-constructs';
import { StorageConstruct } from './constructs/storage-constructs';
import { NotificationConstruct } from './constructs/notification-constructs';
import { ComputeConstruct } from './constructs/compute-constructs';
import { EventsConstruct } from './constructs/event-constructs';


export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Database
    const database = new DatabaseConstruct(this, 'Database');

    // 2. Storage
    const storage = new StorageConstruct(this, 'Storage', {
      webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
    });

    // 3. Notifications
    const notifications = new NotificationConstruct(this, 'Notifications');

    // 4. Compute & S3 Trigger
    new ComputeConstruct(this, 'Compute', {
      applicationTable: database.applicationsTable,
      uploadBucket: storage.uploadBucket,
    });

    // 5. EventBridge Rules & Routing
    new EventsConstruct(this, 'Events', {
      uploadBucket: storage.uploadBucket,
      hrTopic: notifications.hrTopic,
    });

    // ─── Stack outputs ───
    new cdk.CfnOutput(this, 'BucketName', { value: storage.uploadBucket.bucketName });
    new cdk.CfnOutput(this, 'TopicArn', { value: notifications.hrTopic.topicArn });
    new cdk.CfnOutput(this, 'TableName', { value: database.applicationsTable.tableName });
  }
}

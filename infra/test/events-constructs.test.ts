import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { EventsConstruct } from '../lib/constructs/event-constructs';
import { StorageConstruct } from '../lib/constructs/storage-constructs';
import { NotificationConstruct } from '../lib/constructs/notification-constructs';

test('EventsConstruct creates EventBridge routing rules and log groups', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');

  const storage = new StorageConstruct(stack, 'TestStorage');
  const notifications = new NotificationConstruct(stack, 'TestNotifications');

  new EventsConstruct(stack, 'TestEvents', {
    uploadBucket: storage.uploadBucket,
    hrTopic: notifications.hrTopic,
  });

  const template = Template.fromStack(stack);

  // Assert EventBridge Rules are created with correct names
  template.hasResourceProperties('AWS::Events::Rule', {
    Name: 'new-application-notification',
    EventPattern: {
      'detail-type': ['Object Created'],
      source: ['aws.s3'],
    },
  });
  template.hasResourceProperties('AWS::Events::Rule', {
    Name: 'pdf-upload-routing',
    EventPattern: {
      'detail-type': ['Object Created'],
      source: ['aws.s3'],
    },
  });
  template.hasResourceProperties('AWS::Events::Rule', {
    Name: 'json-upload-routing',
    EventPattern: {
      'detail-type': ['Object Created'],
      source: ['aws.s3'],
    },
  });

  // Assert CloudWatch Log Groups for PDF and JSON events are created
  template.hasResourceProperties('AWS::Logs::LogGroup', {
    LogGroupName: '/events/pdf-uploads',
  });
  template.hasResourceProperties('AWS::Logs::LogGroup', {
    LogGroupName: '/events/json-uploads',
  });
});
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NotificationConstruct } from '../lib/constructs/notification-constructs';

test('NotificationsConstruct creates SNS topic and email subscription', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  
  new NotificationConstruct(stack, 'TestNotifications');

  const template = Template.fromStack(stack);

  // Assert SNS Topic name
  template.hasResourceProperties('AWS::SNS::Topic', {
    TopicName: 'hr-new-application',
  });

  // Assert Email Subscription endpoint
  template.hasResourceProperties('AWS::SNS::Subscription', {
    Protocol: 'email',
    Endpoint: 'support@advikprep.com',
  });
});
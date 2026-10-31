import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DatabaseConstruct } from '../lib/constructs/database-constructs';

test('DatabaseConstruct creates DynamoDB table with PAY_PER_REQUEST billing', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  
  // Instantiate just the construct you want to test
  new DatabaseConstruct(stack, 'TestDatabase');

  const template = Template.fromStack(stack);

  // Assert table properties
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      {
        AttributeName: 'applicationId',
        KeyType: 'HASH',
      },
    ],
  });
});
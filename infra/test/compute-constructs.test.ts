import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ComputeConstruct } from '../lib/constructs/compute-constructs';
import { DatabaseConstruct } from '../lib/constructs/database-constructs';
import { StorageConstruct } from '../lib/constructs/storage-constructs';

test('ComputeConstruct creates Lambda function and grants required permissions', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  
  const database = new DatabaseConstruct(stack, 'TestDb');
  const storage = new StorageConstruct(stack, 'TestStorage');

  new ComputeConstruct(stack, 'TestCompute', {
    applicationTable: database.applicationsTable,
    uploadBucket: storage.uploadBucket,
  });

  const template = Template.fromStack(stack);

  // Assert Lambda function properties
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs24.x',
    Handler: 'index.handler',
    Timeout: 30,
  });

  // Assert the Lambda can write to DynamoDB and read uploaded objects.
  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Effect: 'Allow',
          Action: Match.arrayWith(['dynamodb:PutItem']),
        }),
        Match.objectLike({
          Effect: 'Allow',
          Action: Match.arrayWith(['s3:GetObject*']),
        }),
      ]),
    },
  });
});
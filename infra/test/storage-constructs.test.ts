import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { StorageConstruct } from '../lib/constructs/storage-constructs';

test('StorageConstruct creates S3 bucket with CORS settings', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  
  new StorageConstruct(stack, 'TestStorage');

  const template = Template.fromStack(stack);

  // Assert S3 bucket properties and CORS configuration
  template.hasResourceProperties('AWS::S3::Bucket', {
    CorsConfiguration: {
      CorsRules: [
        {
          AllowedMethods: ['PUT'],
          AllowedOrigins: ['http://localhost:3000'],
          AllowedHeaders: ['content-type', 'x-amz-meta-*'],
          ExposedHeaders: ['ETag'],
        },
      ],
    },
  });
});

test('StorageConstruct allows uploads from the configured web origin', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'ConfiguredOriginTestStack');

  new StorageConstruct(stack, 'TestStorage', {
    webOrigin: 'https://applications.example.com',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    CorsConfiguration: {
      CorsRules: [
        {
          AllowedOrigins: ['https://applications.example.com'],
        },
      ],
    },
  });
});
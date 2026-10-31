import type { S3Event, S3Handler } from 'aws-lambda';

const mockS3Send = jest.fn();
const mockDdbSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  HeadObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockDdbSend }),
  },
  PutCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

let handler: S3Handler;

beforeAll(() => {
  process.env.TABLE_NAME = 'job-applications';
  ({ handler } = require('../lib/lambdas/process-upload') as { handler: S3Handler });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockS3Send.mockResolvedValue({
    Metadata: {
      'applicant-name': 'Jane Smith',
      'applicant-email': 'jane@example.com',
      position: 'frontend',
    },
  });
  mockDdbSend.mockResolvedValue({});
});

test('writes the application using the DynamoDB table partition key', async () => {
  const event = {
    Records: [{
      s3: {
        bucket: { name: 'applications-bucket' },
        object: { key: 'uploads/resume.pdf', size: 1234 },
      },
    }],
  } as unknown as S3Event;

  await handler(event, {} as never, () => undefined);

  expect(mockDdbSend).toHaveBeenCalledTimes(1);
  const [putCommand] = mockDdbSend.mock.calls[0];
  expect(putCommand.input.TableName).toBe('job-applications');
  expect(putCommand.input.Item).toEqual(expect.objectContaining({
    applicationId: expect.any(String),
    applicantName: 'Jane Smith',
    applicantEmail: 'jane@example.com',
    position: 'frontend',
    resumeKey: 'uploads/resume.pdf',
    fileType: 'pdf',
    fileSize: 1234,
  }));
  expect(putCommand.input.Item).not.toHaveProperty('applicantId');
});

test('does not swallow DynamoDB write failures', async () => {
  const event = {
    Records: [{
      s3: {
        bucket: { name: 'applications-bucket' },
        object: { key: 'uploads/resume.pdf', size: 1234 },
      },
    }],
  } as unknown as S3Event;
  const error = new Error('DynamoDB unavailable');
  mockDdbSend.mockRejectedValueOnce(error);

  await expect(handler(event, {} as never, () => undefined)).rejects.toBe(error);
});

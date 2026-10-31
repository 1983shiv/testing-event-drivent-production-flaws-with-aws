const mockS3Send = jest.fn();
const mockGetSignedUrl = jest.fn();

let postUpload: (request: Request) => Promise<Response>;

beforeAll(() => {
  process.env.S3_BUCKET_NAME = 'applications-bucket';
  process.env.AWS_REGION = 'ap-south-1';
  jest.doMock(require.resolve('../../web/node_modules/@aws-sdk/client-s3'), () => ({
    S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  }));
  jest.doMock(require.resolve('../../web/node_modules/@aws-sdk/s3-request-presigner'), () => ({
    getSignedUrl: mockGetSignedUrl,
  }));
  ({ POST: postUpload } = require('../../web/app/api/upload/route') as {
    POST: (request: Request) => Promise<Response>;
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockS3Send.mockResolvedValue({});
  mockGetSignedUrl.mockResolvedValue('https://s3.example.com/presigned-upload');
});

test('stores a no-file application as a JSON object in the Lambda trigger prefix', async () => {
  const response = await postUpload(new Request('http://localhost/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jane Smith',
      email: 'jane@example.com',
      position: 'frontend',
      fileName: null,
      contentType: null,
    }),
  }));
  const { PutObjectCommand } = jest.requireMock(
    require.resolve('../../web/node_modules/@aws-sdk/client-s3'),
  ) as {
    PutObjectCommand: jest.Mock;
  };
  const input = PutObjectCommand.mock.calls[0][0];

  expect(response.status).toBe(200);
  expect(input.Key).toMatch(/^uploads\/.+-application\.json$/);
  expect(input.ContentType).toBe('application/json');
  expect(JSON.parse(input.Body)).toEqual(expect.objectContaining({
    name: 'Jane Smith',
    email: 'jane@example.com',
    position: 'frontend',
    type: 'form-only',
  }));
  expect(mockS3Send).toHaveBeenCalledTimes(1);
});

test('creates an S3 upload URL for a file and includes applicant metadata', async () => {
  const response = await postUpload(new Request('http://localhost/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jane Smith',
      email: 'jane@example.com',
      position: 'frontend',
      fileName: 'resume.pdf',
      contentType: 'application/pdf',
    }),
  }));
  const { PutObjectCommand } = jest.requireMock(
    require.resolve('../../web/node_modules/@aws-sdk/client-s3'),
  ) as {
    PutObjectCommand: jest.Mock;
  };
  const input = PutObjectCommand.mock.calls[0][0];
  const { getSignedUrl } = jest.requireMock(
    require.resolve('../../web/node_modules/@aws-sdk/s3-request-presigner'),
  ) as {
    getSignedUrl: jest.Mock;
  };
  const body = await response.json() as {
    presignedUrl?: unknown;
    key?: unknown;
  };

  expect(response.status).toBe(200);
  expect(body.presignedUrl).toBe('https://s3.example.com/presigned-upload');
  expect(body.key).toMatch(/^uploads\/.+-resume\.pdf$/);
  expect(input.ContentType).toBe('application/pdf');
  expect(input.Metadata).toEqual({
    'applicant-name': 'Jane Smith',
    'applicant-email': 'jane@example.com',
    position: 'frontend',
  });
  expect(getSignedUrl).toHaveBeenCalledTimes(1);
  expect(mockS3Send).not.toHaveBeenCalled();
});

test('reports S3 write failures instead of returning success', async () => {
  mockS3Send.mockRejectedValueOnce(new Error('S3 unavailable'));
  const response = await postUpload(new Request('http://localhost/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jane Smith',
      email: 'jane@example.com',
      position: 'frontend',
      fileName: null,
      contentType: null,
    }),
  }));

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: 'Could not save the application to S3',
  });
});

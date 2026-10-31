import { S3Event, S3Handler } from 'aws-lambda' 
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'


const s3Client = new S3Client({})
const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLE_NAME = process.env.TABLE_NAME;

export const handler:S3Handler = async(event: S3Event): Promise<void> => {
    if (!TABLE_NAME) {
        throw new Error("TABLE_NAME environment variable is not set");
    }

    for (const record of event.Records){
        const bucket = record.s3.bucket.name;
        // url-encoded keys in s3 events replace spaces with "+"
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const size = record.s3.object.size;

        // Retrieve applicant info from S3 object metadata
        const head = await s3Client.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: key
            })
        );

        const metadata = head.Metadata || {};
        const applicantName = metadata['applicant-name'] || 'Unknown';
        const applicantEmail = metadata['applicant-email'] || 'Unknown';
        const position = metadata['position'] || 'Unknown';
        const fileType = key.includes('.') ? key.split('.').pop()! : 'Unknown';

        // Save application to DynamoDB
        const applicationId = randomUUID();
        await ddbDocClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    applicationId,
                    applicantName,
                    applicantEmail,
                    position,
                    resumeKey: key,
                    fileType,
                    fileSize: size,
                    uploadAt: new Date().toISOString(),
                    status: 'RECEIVED'
                }
            })
        );

        console.log(
            JSON.stringify({
                message: 'Application processed',
                applicationId,
                applicant: applicantName,
                position,
                file: `s3://${bucket}/${key}`,
                size,
            })
        );
    }
}
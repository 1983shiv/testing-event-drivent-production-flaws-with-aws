import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1'});
const BUCKET = process.env.S3_BUCKET_NAME;

export async function POST(request: Request){
    if (!BUCKET) {
        return NextResponse.json({ error: "S3_BUCKET_NAME environment variable is not set" }, { status: 500 });
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    if (!isRecord(payload)) {
        return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
    }

    const { name, email, position, fileName, contentType } = payload;
    if (
        typeof name !== 'string' || !name.trim() ||
        typeof email !== 'string' || !email.trim() ||
        typeof position !== 'string' || !position.trim()
    ) {
        return NextResponse.json({ error: "Name, email, and position are required" }, { status: 400 });
    }

    if ((typeof fileName === 'string') !== (typeof contentType === 'string')) {
        return NextResponse.json({ error: "File name and content type must be provided together" }, { status: 400 });
    }
    if (
        typeof fileName === 'string' &&
        typeof contentType === 'string' &&
        (!fileName.trim() || !contentType.trim())
    ) {
        return NextResponse.json({ error: "File name and content type cannot be empty" }, { status: 400 });
    }

    // Applicant info stored as S3 Object metadata
    // Lambda retrieves this via headObject after the event fires.
    const metadata = {
        'applicant-name': name.trim(),
        'applicant-email': email.trim(),
        position: position.trim(),
    }

    const objectId = randomUUID();
    if (typeof fileName === 'string' && typeof contentType === 'string') {
        const key = `uploads/${objectId}-${fileName.trim()}`;
        try {
            const command = new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                ContentType: contentType.trim(),
                Metadata: metadata
            });

            const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
            return NextResponse.json({ presignedUrl, key });
        } catch (error) {
            console.error('Failed to create S3 upload URL', error);
            return NextResponse.json({ error: "Could not prepare the file upload" }, { status: 500 });
        }
    } else {
        const key = `uploads/${objectId}-application.json`;
        const body = JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            position: position.trim(),
            submittedAt: new Date().toISOString(),
            type: 'form-only',
        });

        try {
            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                    ContentType: 'application/json',
                    Body: body,
                    Metadata: metadata
                })
            );

            return NextResponse.json({ key, message: "Application submitted" });
        } catch (error) {
            console.error('Failed to save application JSON to S3', error);
            return NextResponse.json({ error: "Could not save the application to S3" }, { status: 500 });
        }
    }
}
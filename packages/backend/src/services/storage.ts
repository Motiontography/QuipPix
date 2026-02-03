import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

const BUCKET = config.s3.bucket;

export async function uploadInput(imageBuffer: Buffer): Promise<string> {
  const key = `inputs/${uuid()}.png`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png',
      Metadata: {
        'x-ttl-at': new Date(Date.now() + config.storage.ttlSeconds * 1000).toISOString(),
      },
    }),
  );
  logger.debug({ key }, 'Uploaded input image');
  return key;
}

export async function uploadResult(imageBuffer: Buffer, jobId: string): Promise<string> {
  const key = `results/${jobId}.png`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png',
      Metadata: {
        'x-ttl-at': new Date(Date.now() + config.storage.ttlSeconds * 1000).toISOString(),
      },
    }),
  );
  logger.debug({ key }, 'Uploaded result image');
  return key;
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: config.storage.signedUrlExpiry });
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  logger.debug({ key }, 'Deleted S3 object');
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body = res.Body;
  if (!body) throw new Error(`Empty S3 object: ${key}`);
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * TTL cleanup: delete all objects whose x-ttl-at has passed.
 * In production, replace with S3 lifecycle rules.
 */
export async function cleanupExpired(): Promise<number> {
  let deleted = 0;
  const now = new Date();

  for (const prefix of ['inputs/', 'results/']) {
    let continuationToken: string | undefined;
    do {
      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 100,
        }),
      );

      for (const obj of list.Contents ?? []) {
        if (!obj.Key) continue;
        // Check TTL from upload time + ttlSeconds as fallback
        const uploadedAt = obj.LastModified ?? new Date(0);
        const expiresAt = new Date(uploadedAt.getTime() + config.storage.ttlSeconds * 1000);
        if (now > expiresAt) {
          await deleteObject(obj.Key);
          deleted++;
        }
      }

      continuationToken = list.NextContinuationToken;
    } while (continuationToken);
  }

  logger.info({ deleted }, 'TTL cleanup completed');
  return deleted;
}

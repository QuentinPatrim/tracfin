// lib/storage.ts — client S3 (Scaleway Object Storage, Paris)

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID, createHash } from "crypto";

const region = process.env.SCW_REGION;
const endpoint = process.env.SCW_ENDPOINT;
const accessKeyId = process.env.SCW_ACCESS_KEY_ID;
const secretAccessKey = process.env.SCW_SECRET_ACCESS_KEY;
const bucket = process.env.SCW_BUCKET;

if (!region || !endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Scaleway env vars missing (SCW_*)");
}

export const BUCKET = bucket;

export const s3 = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: false,
});

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const MAX_BYTES = 10 * 1024 * 1024;

const EXT_FROM_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export interface UploadResult {
  key: string;
  size: number;
  sha256: string;
  contentType: string;
}

export async function uploadFile(
  file: File,
  dossierId: string
): Promise<UploadResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError(`MIME type non autorisé: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError(`Fichier trop lourd (max ${MAX_BYTES / 1024 / 1024} Mo)`);
  }
  if (file.size === 0) {
    throw new UploadError("Fichier vide");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const ext = EXT_FROM_MIME[file.type];
  const key = `${dossierId}/${Date.now()}-${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ServerSideEncryption: "AES256",
      Metadata: {
        sha256,
        "original-name": encodeURIComponent(file.name).slice(0, 200),
      },
    })
  );

  return { key, size: file.size, sha256, contentType: file.type };
}

export async function getFileStream(key: string) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!res.Body) throw new Error("Fichier introuvable");
  return {
    body: res.Body as ReadableStream,
    contentType: res.ContentType ?? "application/octet-stream",
    contentLength: res.ContentLength,
    sha256: res.Metadata?.sha256,
  };
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function presignDownload(key: string, ttlSec = 60): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: ttlSec,
  });
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

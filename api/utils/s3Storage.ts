import {
  S3Client,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
import type { FileEntry, StorageAdapter } from "../storage.ts";

const BUCKET = "figcnc";
const EXPIRY_MS = 24 * 60 * 60 * 1000;

const s3 = new S3Client({
  region: Deno.env.get("AWS_REGION") ?? "us-east-1",
});

export class S3Storage implements StorageAdapter {
  private key(roomId: string, filename: string): string {
    return `rooms/${roomId}/${filename}`;
  }

  async save(roomId: string, filename: string, svgBytes: Uint8Array): Promise<void> {
    const expiresAt = new Date(Date.now() + EXPIRY_MS);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: this.key(roomId, filename),
        Body: svgBytes,
        ContentType: "image/svg+xml",
        Expires: expiresAt,
        Metadata: { "expires-at": expiresAt.toISOString() },
      }),
    );
  }

  async exists(roomId: string): Promise<boolean> {
    const result = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `rooms/${roomId}/`, MaxKeys: 1 }),
    );
    return (result.Contents?.length ?? 0) > 0;
  }

  async list(roomId: string): Promise<FileEntry[]> {
    const now = Date.now();
    const listed = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `rooms/${roomId}/` }),
    );

    const entries: FileEntry[] = [];
    for (const obj of listed.Contents ?? []) {
      const head = await s3.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: obj.Key }),
      );
      const expiresAt = head.Metadata?.["expires-at"];
      if (expiresAt && new Date(expiresAt).getTime() < now) continue;

      const filename = obj.Key!.split("/").pop()!;
      entries.push({
        filename,
        url: await this.getDownloadUrl(roomId, filename),
        expiresAt: expiresAt ?? "",
      });
    }

    return entries;
  }

  async getDownloadUrl(roomId: string, filename: string): Promise<string> {
    // signed URL valid for the full 24-hour file lifetime
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: this.key(roomId, filename) }), { expiresIn: EXPIRY_MS / 1000 });
  }

  async remove(roomId: string, filename: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: this.key(roomId, filename) }));
  }
}


import type { FileEntry, StorageAdapter } from "../storage.ts";

const BUCKET = "figcuts";
const EXPIRY_MS = 24 * 60 * 60 * 1000;

export class S3Storage implements StorageAdapter {
  private client: any;

  constructor() {
    this.client = null; // initialised lazily via getClient()
  }

  private async getClient() {
    if (this.client) return this.client;
    // @ts-ignore
    const { S3Client } = await import("npm:@aws-sdk/client-s3");
    this.client = new S3Client({
      region: Deno.env.get("AWS_REGION") ?? "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") ?? "",
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") ?? "",
      },
    });
    return this.client;
  }

  private key(roomId: string, filename: string): string {
    return `rooms/${roomId}/${filename}`;
  }

  async save(roomId: string, filename: string, svgBytes: Uint8Array): Promise<void> {
    // @ts-ignore
    const { PutObjectCommand } = await import("npm:@aws-sdk/client-s3");
    const client = await this.getClient();
    const expiresAt = new Date(Date.now() + EXPIRY_MS);

    await client.send(
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
    // @ts-ignore
    const { ListObjectsV2Command } = await import("npm:@aws-sdk/client-s3");
    const client = await this.getClient();
    const result = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `rooms/${roomId}/`, MaxKeys: 1 }),
    );
    return (result.Contents?.length ?? 0) > 0;
  }

  async list(roomId: string): Promise<FileEntry[]> {
    // @ts-ignore
    const { ListObjectsV2Command, HeadObjectCommand } = await import("npm:@aws-sdk/client-s3");
    const client = await this.getClient();
    const now = Date.now();

    const listed = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `rooms/${roomId}/` }),
    );

    const entries: FileEntry[] = [];
    for (const obj of listed.Contents ?? []) {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: obj.Key }),
      );
      const expiresAt = head.Metadata?.["expires-at"];
      if (expiresAt && new Date(expiresAt).getTime() < now) continue;

      const filename = obj.Key!.split("/").pop()!;
      entries.push({
        filename,
        url: this.getDownloadUrl(roomId, filename),
        expiresAt: expiresAt ?? "",
      });
    }

    return entries;
  }

  getDownloadUrl(roomId: string, filename: string): string {
    return `https://${BUCKET}.s3.amazonaws.com/${this.key(roomId, filename)}`;
  }
}

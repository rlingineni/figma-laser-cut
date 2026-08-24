export interface FileEntry {
  filename: string;
  url: string;
  expiresAt: string;
}

export interface StorageAdapter {
  save(roomId: string, filename: string, svgBytes: Uint8Array): Promise<void>;
  list(roomId: string): Promise<FileEntry[]>;
  exists(roomId: string): Promise<boolean>;
  remove(roomId: string, filename: string): Promise<void>;
  getDownloadUrl(roomId: string, filename: string): string;
}

// ---------------------------------------------------------------------------
// Local disk — for development
// ---------------------------------------------------------------------------

const EXPIRY_MS = 24 * 60 * 60 * 1000;
const BUCKET = "figcuts";

export class LocalDiskStorage implements StorageAdapter {
  private root: string;

  constructor(root = "./api/.local-rooms") {
    this.root = root;
  }

  private roomDir(roomId: string): string {
    return `${this.root}/${roomId}`;
  }

  async save(roomId: string, filename: string, svgBytes: Uint8Array): Promise<void> {
    const dir = this.roomDir(roomId);
    await Deno.mkdir(dir, { recursive: true });
    await Deno.writeFile(`${dir}/${filename}`, svgBytes);
  }

  async list(roomId: string): Promise<FileEntry[]> {
    const dir = this.roomDir(roomId);
    const now = Date.now();
    const entries: FileEntry[] = [];

    try {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isFile) continue;
        const path = `${dir}/${entry.name}`;
        const stat = await Deno.stat(path);
        const mtime = stat.mtime?.getTime() ?? 0;

        if (now - mtime > EXPIRY_MS) {
          await Deno.remove(path);
          continue;
        }

        entries.push({
          filename: entry.name,
          url: this.getDownloadUrl(roomId, entry.name),
          expiresAt: new Date(mtime + EXPIRY_MS).toISOString(),
        });
      }
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) throw e;
    }

    return entries;
  }

  async exists(roomId: string): Promise<boolean> {
    try {
      return (await Deno.stat(this.roomDir(roomId))).isDirectory;
    } catch {
      return false;
    }
  }

  async remove(roomId: string, filename: string): Promise<void> {
    await Deno.remove(`${this.roomDir(roomId)}/${filename}`);
  }

  getDownloadUrl(roomId: string, filename: string): string {
    return `/room/${roomId}/file/${filename}`;
  }
}

// ---------------------------------------------------------------------------
// S3 — for production (Deno Deploy)
// ---------------------------------------------------------------------------

export class S3Storage implements StorageAdapter {
  // deno-lint-ignore no-explicit-any
  private client: any;

  constructor() {
    this.client = null;
  }

  private async getClient() {
    if (this.client) return this.client;
    // @ts-ignore: dynamic import for Deno Deploy compatibility
    const { S3Client } = await import("npm:@aws-sdk/client-s3@^3");
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
    // @ts-ignore: dynamic import for Deno Deploy compatibility
    const { PutObjectCommand } = await import("npm:@aws-sdk/client-s3@^3");
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

  async list(roomId: string): Promise<FileEntry[]> {
    // @ts-ignore: dynamic import for Deno Deploy compatibility
    const { ListObjectsV2Command, HeadObjectCommand } = await import("npm:@aws-sdk/client-s3@^3");
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

  async exists(roomId: string): Promise<boolean> {
    // @ts-ignore: dynamic import for Deno Deploy compatibility
    const { ListObjectsV2Command } = await import("npm:@aws-sdk/client-s3@^3");
    const client = await this.getClient();
    const result = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `rooms/${roomId}/`, MaxKeys: 1 }),
    );
    return (result.Contents?.length ?? 0) > 0;
  }

  async remove(roomId: string, filename: string): Promise<void> {
    // @ts-ignore: dynamic import for Deno Deploy compatibility
    const { DeleteObjectCommand } = await import("npm:@aws-sdk/client-s3@^3");
    const client = await this.getClient();
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: this.key(roomId, filename) }));
  }

  getDownloadUrl(roomId: string, filename: string): string {
    return `https://${BUCKET}.s3.amazonaws.com/${this.key(roomId, filename)}`;
  }
}

export interface FileEntry {
  filename: string;
  url: string;
  downloadUrl: string;
  expiresAt: string;
}

export const EXPIRY_MS = 24 * 60 * 60 * 1000;

function key(roomId: string, filename: string): string {
  return `rooms/${roomId}/${filename}`;
}

function isExpired(expiresAt: string | undefined, now = Date.now()): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() < now;
}

export function fileUrl(origin: string, roomId: string, filename: string, asAttachment = false): string {
  const base = `${origin}/room/${encodeURIComponent(roomId)}/file/${encodeURIComponent(filename)}`;
  return asAttachment ? `${base}?download=1` : base;
}

export class R2Storage {
  constructor(private bucket: R2Bucket, private origin: string) {}

  async save(roomId: string, filename: string, svgBytes: Uint8Array): Promise<void> {
    const expiresAt = new Date(Date.now() + EXPIRY_MS);
    await this.bucket.put(key(roomId, filename), svgBytes, {
      httpMetadata: { contentType: "image/svg+xml" },
      customMetadata: { "expires-at": expiresAt.toISOString() },
    });
  }

  async exists(roomId: string): Promise<boolean> {
    const result = await this.bucket.list({ prefix: `rooms/${roomId}/`, limit: 1 });
    return result.objects.length > 0;
  }

  async list(roomId: string): Promise<FileEntry[]> {
    const now = Date.now();
    const entries: FileEntry[] = [];
    let cursor: string | undefined;

    do {
      const listed = await this.bucket.list({
        prefix: `rooms/${roomId}/`,
        include: ["customMetadata"],
        cursor,
      });
      for (const obj of listed.objects) {
        const expiresAt = obj.customMetadata?.["expires-at"];
        if (isExpired(expiresAt, now)) continue;

        const filename = obj.key.split("/").pop()!;
        entries.push({
          filename,
          url: fileUrl(this.origin, roomId, filename),
          downloadUrl: fileUrl(this.origin, roomId, filename, true),
          expiresAt: expiresAt ?? "",
        });
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    return entries;
  }

  async get(roomId: string, filename: string): Promise<R2ObjectBody | null> {
    const obj = await this.bucket.get(key(roomId, filename));
    if (!obj || isExpired(obj.customMetadata?.["expires-at"])) return null;
    return obj;
  }

  async remove(roomId: string, filename: string): Promise<void> {
    await this.bucket.delete(key(roomId, filename));
  }
}

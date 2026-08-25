import type { FileEntry, StorageAdapter } from "../storage.ts";

const EXPIRY_MS = 24 * 60 * 60 * 1000;

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
          url: await this.getDownloadUrl(roomId, entry.name),
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

  async getDownloadUrl(_roomId: string, filename: string): Promise<string> {
    return `/room/${_roomId}/file/${encodeURIComponent(filename)}`;
  }
}

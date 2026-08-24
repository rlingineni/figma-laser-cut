export interface FileEntry {
  filename: string;
  url: string;
  expiresAt: string;
}

export interface StorageAdapter {
  save(roomId: string, filename: string, svgBytes: Uint8Array): Promise<void>;
  list(roomId: string): Promise<FileEntry[]>;
  exists(roomId: string): Promise<boolean>;
  getDownloadUrl(roomId: string, filename: string): string;
}

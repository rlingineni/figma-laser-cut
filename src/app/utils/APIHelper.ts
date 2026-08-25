// @ts-expect-error
const IS_DEV = process.env.NODE_ENV !== "production";
const BASE_URL = IS_DEV ? "http://localhost:8000" : "https://figcuts-api.rlingineni.deno.net";

export interface RoomInfo {
  roomId: string;
  url: string;
}

export interface FileInfo {
  filename: string;
  url: string;
  expiresAt: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`API ${options?.method ?? "GET"} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function createRoom(): Promise<RoomInfo> {
  return request<RoomInfo>("/room", { method: "POST" });
}

export async function uploadFile(roomId: string, filename: string, svgString: string): Promise<FileInfo> {
  return request<FileInfo>(`/room/${roomId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: `${filename}.svg`, svg: btoa(svgString) }),
  });
}

export async function listFiles(roomId: string): Promise<FileInfo[]> {
  return request<FileInfo[]>(`/room/${roomId}`);
}

export { BASE_URL };

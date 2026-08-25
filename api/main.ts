import { Application, Context, Router } from "@oak/oak";
import { generateRoomId } from "./utils/generateRoomId.ts";
import type { StorageAdapter } from "./storage.ts";
import { LocalDiskStorage } from "./utils/diskStorage.ts";
import { S3Storage } from "./utils/s3Storage.ts";
import { roomPage, notFoundPage } from "./pages/room.tsx";
import { indexPage } from "./pages/index.ts";

const IS_LOCAL = Deno.env.get("IS_LOCAL") === "true";
const storage: StorageAdapter = IS_LOCAL ? new LocalDiskStorage() : new S3Storage();

function isSvg(bytes: Uint8Array): boolean {
  const prefix = new TextDecoder().decode(bytes.slice(0, 100)).trimStart();
  return prefix.startsWith("<svg") || prefix.startsWith("<?xml");
}

function html(ctx: Context, body: string) {
  ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
  ctx.response.body = body;
}

const router = new Router();

router.get("/", (ctx) => {
  html(ctx, indexPage());
});

router.post("/room", (ctx) => {
  const roomId = generateRoomId();
  ctx.response.body = { roomId, url: `/room/${roomId}` };
});

router.get("/room/:id", async (ctx) => {
  if (!await storage.exists(ctx.params.id)) {
    if (ctx.request.headers.get("accept")?.includes("text/html")) {
      ctx.response.status = 404;
      html(ctx, notFoundPage(ctx.params.id));
    } else {
      ctx.response.status = 404;
      ctx.response.body = { error: "Room not found" };
    }
    return;
  }
  const files = (await storage.list(ctx.params.id))
    .sort((a: { expiresAt: string }, b: { expiresAt: string }) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
  // serve HTML for browsers, JSON for API clients
  if (ctx.request.headers.get("accept")?.includes("text/html")) {
    html(ctx, roomPage(ctx.params.id, files));
  } else {
    ctx.response.body = files;
  }
});

router.post("/room/:id", async (ctx) => {
  const { filename, svg } = await ctx.request.body.json();

  if (!filename || !svg) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing filename or svg" };
    return;
  }

  if (!filename.toLowerCase().endsWith(".svg")) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Only .svg files are accepted" };
    return;
  }

  let svgBytes: Uint8Array;
  try {
    svgBytes = Uint8Array.from(atob(svg), (c) => c.charCodeAt(0));
  } catch {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid base64 encoding" };
    return;
  }

  if (!isSvg(svgBytes)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "File content is not a valid SVG" };
    return;
  }

  await storage.save(ctx.params.id, filename, svgBytes);
  ctx.response.body = { filename, url: storage.getDownloadUrl(ctx.params.id, filename) };
});

router.delete("/room/:id/file/:filename", async (ctx) => {
  if (!await storage.exists(ctx.params.id)) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Room not found" };
    return;
  }
  await storage.remove(ctx.params.id, ctx.params.filename);
  ctx.response.body = { ok: true };
});

// local dev only — S3 rooms use presigned/public URLs directly
if (IS_LOCAL) {
  router.get("/room/:id/file/:filename", async (ctx) => {
    try {
      const bytes = await Deno.readFile(`./api/.local-rooms/${ctx.params.id}/${ctx.params.filename}`);
      ctx.response.headers.set("Content-Type", "image/svg+xml");
      ctx.response.body = bytes;
    } catch {
      ctx.response.status = 404;
      ctx.response.body = { error: "File not found" };
    }
  });
}

const app = new Application();

app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }

  await next();
});


app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", ({ port }) => {
  console.log(`API server running at http://localhost:${port}`);
});

await app.listen({ port: 8000 });

import { Hono } from "hono";
import { cors } from "hono/cors";
import { generateRoomId } from "./utils/generateRoomId.ts";
import { R2Storage, fileUrl } from "./storage.ts";
import { roomPage, notFoundPage } from "./pages/room.tsx";
import { indexPage } from "./pages/index.ts";

type Env = { Bindings: { BUCKET: R2Bucket }; Variables: { storage: R2Storage } };

function isSvg(bytes: Uint8Array): boolean {
  const prefix = new TextDecoder().decode(bytes.slice(0, 100)).trimStart();
  return prefix.startsWith("<svg") || prefix.startsWith("<?xml");
}

function wantsHtml(accept: string | undefined): boolean {
  return !!accept?.includes("text/html");
}

const app = new Hono<Env>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.use("*", async (c, next) => {
  c.set("storage", new R2Storage(c.env.BUCKET, new URL(c.req.url).origin));
  await next();
});

app.get("/", (c) => c.html(indexPage()));

app.post("/room", (c) => {
  const roomId = generateRoomId();
  return c.json({ roomId, url: `/room/${roomId}` });
});

app.get("/room/:id", async (c) => {
  const id = c.req.param("id");
  const storage = c.var.storage;
  const html = wantsHtml(c.req.header("accept"));

  if (!await storage.exists(id)) {
    return html ? c.html(notFoundPage(id), 404) : c.json({ error: "Room not found" }, 404);
  }

  const files = (await storage.list(id))
    .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
  // serve HTML for browsers, JSON for API clients
  return html ? c.html(roomPage(id, files)) : c.json(files);
});

app.post("/room/:id", async (c) => {
  const id = c.req.param("id");
  let body: { filename?: string; svg?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const { filename, svg } = body;

  if (!filename || !svg) {
    return c.json({ error: "Missing filename or svg" }, 400);
  }

  if (!filename.toLowerCase().endsWith(".svg")) {
    return c.json({ error: "Only .svg files are accepted" }, 400);
  }

  let svgBytes: Uint8Array;
  try {
    svgBytes = Uint8Array.from(atob(svg), (ch) => ch.charCodeAt(0));
  } catch {
    return c.json({ error: "Invalid base64 encoding" }, 400);
  }

  if (!isSvg(svgBytes)) {
    return c.json({ error: "File content is not a valid SVG" }, 400);
  }

  await c.var.storage.save(id, filename, svgBytes);
  return c.json({ filename, url: fileUrl(new URL(c.req.url).origin, id, filename) });
});

app.get("/room/:id/file/:filename", async (c) => {
  const id = c.req.param("id");
  const filename = c.req.param("filename");
  const obj = await c.var.storage.get(id, filename);
  if (!obj) return c.json({ error: "File not found" }, 404);

  const headers = new Headers({
    "Content-Type": "image/svg+xml",
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
    // user-uploaded SVGs are served from the app's origin; block any embedded scripts
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
  });
  if (c.req.query("download") !== undefined) {
    headers.set("Content-Disposition", `attachment; filename="${filename.replace(/"/g, "")}"`);
  }
  return new Response(obj.body, { headers });
});

app.delete("/room/:id/file/:filename", async (c) => {
  const id = c.req.param("id");
  const storage = c.var.storage;
  if (!await storage.exists(id)) {
    return c.json({ error: "Room not found" }, 404);
  }
  await storage.remove(id, c.req.param("filename"));
  return c.json({ ok: true });
});

export default app;

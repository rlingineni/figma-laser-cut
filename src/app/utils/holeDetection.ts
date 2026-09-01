// Locate a template's through-holes from its rendered PNG: the enclosed
// transparent regions (negative space) are the holes. Returns their bounds in
// absolute canvas coordinates so the plugin can map them to real layer elements.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TemplateImageMeta {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ALPHA_THRESHOLD = 16; // pixels below this alpha count as transparent
const MIN_REGION_PX = 4; // ignore specks smaller than this (in px on a side)

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function detectHoles(
  pngBase64: string,
  bbox: TemplateImageMeta
): Promise<Rect[]> {
  const img = await loadImage(`data:image/png;base64,${pngBase64}`);
  const w = img.width;
  const h = img.height;
  if (!w || !h) return [];

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;

  const size = w * h;
  const transparent = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    transparent[i] = data[i * 4 + 3] < ALPHA_THRESHOLD ? 1 : 0;
  }

  // Flood-fill transparency reachable from the border = the outside.
  const outside = new Uint8Array(size);
  const stack: number[] = [];
  const pushIfOpen = (x: number, y: number) => {
    const idx = y * w + x;
    if (transparent[idx] && !outside[idx]) {
      outside[idx] = 1;
      stack.push(idx);
    }
  };
  for (let x = 0; x < w; x++) {
    pushIfOpen(x, 0);
    pushIfOpen(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIfOpen(0, y);
    pushIfOpen(w - 1, y);
  }
  while (stack.length) {
    const idx = stack.pop() as number;
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) pushIfOpen(x - 1, y);
    if (x < w - 1) pushIfOpen(x + 1, y);
    if (y > 0) pushIfOpen(x, y - 1);
    if (y < h - 1) pushIfOpen(x, y + 1);
  }

  // Enclosed transparent pixels (not outside) are holes. Label connected comps.
  const visited = new Uint8Array(size);
  const regions: Rect[] = [];
  const scaleX = bbox.width / w;
  const scaleY = bbox.height / h;

  for (let start = 0; start < size; start++) {
    if (!transparent[start] || outside[start] || visited[start]) continue;
    // BFS this component
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    visited[start] = 1;
    const comp: number[] = [start];
    while (comp.length) {
      const idx = comp.pop() as number;
      const x = idx % w;
      const y = (idx - x) / w;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < w - 1 ? idx + 1 : -1,
        y > 0 ? idx - w : -1,
        y < h - 1 ? idx + w : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && transparent[n] && !outside[n] && !visited[n]) {
          visited[n] = 1;
          comp.push(n);
        }
      }
    }

    const pxW = maxX - minX + 1;
    const pxH = maxY - minY + 1;
    if (pxW < MIN_REGION_PX && pxH < MIN_REGION_PX) continue;

    regions.push({
      x: bbox.x + minX * scaleX,
      y: bbox.y + minY * scaleY,
      width: pxW * scaleX,
      height: pxH * scaleY,
    });
  }

  return regions;
}

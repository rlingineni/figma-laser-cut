// svgUtils.ts
//
// Figma authors coordinates at 72 DPI, but Easel (and similar importers) ignore
// unit suffixes and read the viewBox as pixels at 96 DPI — making parts import at
// 75% size. We keep real mm width/height for unit-aware tools (Illustrator,
// Inkscape, LightBurn) AND rescale the viewBox + geometry by 96/72 so a 96-DPI
// importer resolves to the exact same physical size.
//
// The rescale is baked directly into path coordinates together with every
// transform Figma emitted (rotations, flips, group offsets), so the output has
// no transform attributes for LightBurn to misinterpret.
//
// No DOM required: uses a tiny built-in XML parser, so it runs in the Figma
// plugin main thread (code.ts).
//
// Requires: npm install svgpath

import svgpath from "svgpath";

export const SOURCE_DPI = 72;
export const TARGET_DPI = 96;
export const MM_PER_INCH = 25.4;

// ---------------------------------------------------------------------------
// Minimal XML tree (enough for Figma's well-formed SVG output)
// ---------------------------------------------------------------------------

interface XmlAttr {
  name: string;
  value: string; // kept exactly as written (entities not decoded)
}

interface XmlElement {
  type: "element";
  name: string;
  attrs: XmlAttr[];
  children: XmlNode[];
}

interface XmlRaw {
  type: "raw"; // text, comments, <?xml ?>, CDATA, doctype — passed through untouched
  value: string;
}

type XmlNode = XmlElement | XmlRaw;

const TOKEN_RE =
  /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\/?[A-Za-z_][^\s\/>]*(?:\s+[^\s=\/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*\s*\/?>|[^<]+|</g;

const ATTR_RE = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;

function parseXml(src: string): XmlNode[] {
  const doc: XmlElement = { type: "element", name: "#document", attrs: [], children: [] };
  const stack: XmlElement[] = [doc];

  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(src)) !== null) {
    const tok = m[0];
    const parent = stack[stack.length - 1];

    if (tok.startsWith("</")) {
      if (stack.length > 1) stack.pop();
    } else if (/^<[A-Za-z_]/.test(tok)) {
      const nameMatch = /^<([^\s\/>]+)/.exec(tok) as RegExpExecArray;
      const selfClosing = tok.endsWith("/>");
      const body = tok.slice(nameMatch[0].length, selfClosing ? -2 : -1);

      const attrs: XmlAttr[] = [];
      ATTR_RE.lastIndex = 0;
      let a: RegExpExecArray | null;
      while ((a = ATTR_RE.exec(body)) !== null) {
        const value = a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : "";
        attrs.push({ name: a[1], value });
      }

      const el: XmlElement = { type: "element", name: nameMatch[1], attrs, children: [] };
      parent.children.push(el);
      if (!selfClosing) stack.push(el);
    } else {
      parent.children.push({ type: "raw", value: tok });
    }
  }

  return doc.children;
}

function serializeXml(nodes: XmlNode[]): string {
  let out = "";
  for (const n of nodes) {
    if (n.type === "raw") {
      out += n.value;
      continue;
    }
    const attrs = n.attrs
      .map((a) => ` ${a.name}="${a.value.replace(/"/g, "&quot;")}"`)
      .join("");
    out += n.children.length
      ? `<${n.name}${attrs}>${serializeXml(n.children)}</${n.name}>`
      : `<${n.name}${attrs}/>`;
  }
  return out;
}

function getAttr(el: XmlElement, name: string): string | null {
  for (const a of el.attrs) if (a.name === name) return a.value;
  return null;
}

function setAttr(el: XmlElement, name: string, value: string): void {
  for (const a of el.attrs) {
    if (a.name === name) {
      a.value = value;
      return;
    }
  }
  el.attrs.push({ name, value });
}

function removeAttr(el: XmlElement, name: string): void {
  el.attrs = el.attrs.filter((a) => a.name !== name);
}

// ---------------------------------------------------------------------------
// Shape → path conversion
// ---------------------------------------------------------------------------

const SHAPES = ["path", "line", "rect", "polyline", "polygon", "circle", "ellipse"];
const CONTAINERS = ["svg", "g", "a", "switch"];
const SKIP = ["defs", "clipPath", "mask", "pattern", "symbol", "style", "title", "desc"];
const GEOMETRY_ATTRS = [
  "x", "y", "x1", "y1", "x2", "y2", "width", "height",
  "points", "cx", "cy", "r", "rx", "ry", "d", "transform",
];

const num = (el: XmlElement, attr: string): number =>
  parseFloat(getAttr(el, attr) || "0") || 0;

function toPathData(el: XmlElement): string | null {
  switch (el.name) {
    case "path":
      return getAttr(el, "d");

    case "line":
      return `M${num(el, "x1")} ${num(el, "y1")} L${num(el, "x2")} ${num(el, "y2")}`;

    case "rect": {
      const x = num(el, "x");
      const y = num(el, "y");
      const w = num(el, "width");
      const h = num(el, "height");
      let rx = num(el, "rx") || num(el, "ry");
      let ry = num(el, "ry") || rx;
      rx = Math.min(rx, w / 2);
      ry = Math.min(ry, h / 2);
      if (!rx) return `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
      return (
        `M${x + rx} ${y} H${x + w - rx} ` +
        `A${rx} ${ry} 0 0 1 ${x + w} ${y + ry} V${y + h - ry} ` +
        `A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h} H${x + rx} ` +
        `A${rx} ${ry} 0 0 1 ${x} ${y + h - ry} V${y + ry} ` +
        `A${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`
      );
    }

    case "polyline":
    case "polygon": {
      const p = (getAttr(el, "points") || "").trim().split(/[\s,]+/).map(Number);
      if (p.length < 2) return null;
      let d = `M${p[0]} ${p[1]}`;
      for (let i = 2; i + 1 < p.length; i += 2) d += ` L${p[i]} ${p[i + 1]}`;
      return el.name === "polygon" ? d + " Z" : d;
    }

    case "circle":
    case "ellipse": {
      const cx = num(el, "cx");
      const cy = num(el, "cy");
      const rx = el.name === "circle" ? num(el, "r") : num(el, "rx");
      const ry = el.name === "circle" ? rx : num(el, "ry");
      return (
        `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} ` +
        `A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
      );
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Transform baking
// ---------------------------------------------------------------------------

/** Returns the processed element, or null if it should be removed. */
function walk(el: XmlElement, inherited: string): XmlElement | null {
  if (SKIP.includes(el.name)) return el;

  // Clip paths/masks live in untransformed <defs>; after baking they would
  // clip the wrong region, so drop the references.
  removeAttr(el, "clip-path");
  removeAttr(el, "mask");

  // SVG semantics: ancestor transforms first, own transform last.
  const own = getAttr(el, "transform") || "";
  const full = [inherited, own].filter(Boolean).join(" ");
  removeAttr(el, "transform");

  if (SHAPES.includes(el.name)) {
    const d = toPathData(el);
    if (!d || !d.trim()) return null;

    el.attrs = el.attrs.filter((a) => GEOMETRY_ATTRS.indexOf(a.name) === -1);
    el.attrs.unshift({
      name: "d",
      value: full ? svgpath(d).transform(full).round(4).toString() : d,
    });
    el.name = "path";
    el.children = [];
    return el;
  }

  if (!CONTAINERS.includes(el.name)) {
    // Something we can't bake (image, use, text): keep its combined transform
    // so it stays where it was.
    if (full) setAttr(el, "transform", full);
    return el;
  }

  const kept: XmlNode[] = [];
  for (const child of el.children) {
    if (child.type === "raw") {
      kept.push(child);
      continue;
    }
    const result = walk(child, full);
    if (result) kept.push(result);
  }
  el.children = kept;
  return el;
}

function findSvgRoot(nodes: XmlNode[]): XmlElement | null {
  for (const n of nodes) if (n.type === "element" && n.name === "svg") return n;
  return null;
}

/**
 * Bakes every transform (own + inherited, plus an optional root transform)
 * into path coordinates and removes the transform attributes.
 */
export function bakeTransforms(svg: string, rootTransform = ""): string {
  const nodes = parseXml(svg);
  const root = findSvgRoot(nodes);
  if (!root) return svg;
  walk(root, rootTransform);
  return serializeXml(nodes);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

function parseViewBox(value: string | null): ViewBox | null {
  if (!value) return null;
  const p = value.trim().split(/[\s,]+/).map(Number);
  if (p.length !== 4 || p.some((n) => !isFinite(n))) return null;
  return { minX: p[0], minY: p[1], width: p[2], height: p[3] };
}

/**
 * Rewrites a Figma-exported SVG so it imports at the correct physical size in
 * both unit-aware tools and 96-DPI importers like Easel, with all transforms
 * baked into coordinates.
 * `scale` multiplies the final physical size (default 1 = true Figma dimensions).
 */
export function toLaserSafeSvg(svg: string, scale = 1): string {
  const nodes = parseXml(svg);
  const root = findSvgRoot(nodes);
  if (!root) return svg;

  let rootTransform = "";
  const vb = parseViewBox(getAttr(root, "viewBox"));

  if (vb) {
    const geometryScale = (TARGET_DPI / SOURCE_DPI) * scale;
    const widthMm = (vb.width / SOURCE_DPI) * MM_PER_INCH * scale;
    const heightMm = (vb.height / SOURCE_DPI) * MM_PER_INCH * scale;

    const newViewBox = [vb.minX, vb.minY, vb.width, vb.height]
      .map((n) => +(n * geometryScale).toFixed(4))
      .join(" ");

    setAttr(root, "viewBox", newViewBox);
    setAttr(root, "width", `${widthMm.toFixed(4)}mm`);
    setAttr(root, "height", `${heightMm.toFixed(4)}mm`);
    rootTransform = `scale(${geometryScale})`;
  }

  walk(root, rootTransform);
  return serializeXml(nodes);
}

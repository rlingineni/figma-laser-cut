// Converts the current Figma selection to a DXF drawing for laser cutting.
//
// Strategy: walk the live scene graph (not the exported SVG) so common shapes
// (rectangle, ellipse, star/polygon, line) can be read directly as exact
// properties (width/height/arcData/cornerRadius/pointCount) and emitted as
// native DXF entities (CIRCLE/ARC/ELLIPSE/LINE/POLYLINE). Only VECTOR,
// BOOLEAN_OPERATION and TEXT nodes fall back to parsing `fillGeometry` path
// data, since Figma discards "this was an ellipse" type info once a shape is
// flattened/boolean-combined. Figma's fillGeometry/vectorPaths data only ever
// uses absolute M/L/C/Z commands (no arcs, no relative commands, no H/V/S/T),
// which keeps that fallback parser small.
import Drawing from "dxf-writer";
import { SOURCE_DPI, MM_PER_INCH } from "./svgUtils";

type Pt = [number, number];

const CONTAINER_TYPES = new Set(["GROUP", "FRAME", "COMPONENT", "INSTANCE", "SECTION"]);

// ---- affine transform helpers (Figma Transform = [[m00,m01,m02],[m10,m11,m12]]) ----

function applyPoint(t: Transform, x: number, y: number): Pt {
  return [t[0][0] * x + t[0][1] * y + t[0][2], t[1][0] * x + t[1][1] * y + t[1][2]];
}

// Direction-only transform (no translation) — used for axis/radius vectors.
function applyVector(t: Transform, x: number, y: number): Pt {
  return [t[0][0] * x + t[0][1] * y, t[1][0] * x + t[1][1] * y];
}

function normalizeDeg(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

function normalizeRad(rad: number): number {
  const twoPi = Math.PI * 2;
  const r = rad % twoPi;
  return r < 0 ? r + twoPi : r;
}

// ---- intermediate page-space entities (Figma units, y-down) ----

type PEntity =
  | { kind: "polyline"; points: Pt[]; closed: boolean }
  | { kind: "line"; a: Pt; b: Pt }
  | { kind: "circle"; c: Pt; r: number }
  | { kind: "arc"; c: Pt; r: number; startDeg: number; endDeg: number }
  | { kind: "ellipse"; c: Pt; majorAxis: Pt; ratio: number; startRad: number; endRad: number }
  | { kind: "spline"; ctrl: Pt[] };

// ---- fallback path parser: Figma's fillGeometry/vectorPaths only emit absolute M/L/C/Z ----

interface PathSegment {
  type: "line" | "cubic";
  to: Pt;
  c1?: Pt;
  c2?: Pt;
}

interface SubPath {
  start: Pt;
  segments: PathSegment[];
  closed: boolean;
}

function parseFigmaPathData(d: string): SubPath[] {
  const subPaths: SubPath[] = [];
  let current: SubPath | null = null;
  const re = /([MLCZ])([^MLCZ]*)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d))) {
    const cmd = match[1].toUpperCase();
    const nums = match[2].trim().length ? match[2].trim().split(/[\s,]+/).map(Number) : [];
    if (cmd === "M") {
      if (current) subPaths.push(current);
      current = { start: [nums[0], nums[1]], segments: [], closed: false };
    } else if (cmd === "L" && current) {
      current.segments.push({ type: "line", to: [nums[0], nums[1]] });
    } else if (cmd === "C" && current) {
      current.segments.push({
        type: "cubic",
        c1: [nums[0], nums[1]],
        c2: [nums[2], nums[3]],
        to: [nums[4], nums[5]],
      });
    } else if (cmd === "Z" && current) {
      current.closed = true;
    }
  }
  if (current) subPaths.push(current);
  return subPaths;
}

function subPathToEntities(sub: SubPath, t: Transform): PEntity[] {
  const entities: PEntity[] = [];
  const tp = (p: Pt) => applyPoint(t, p[0], p[1]);
  let run: Pt[] = [tp(sub.start)];
  let cursor = sub.start;
  const flush = () => {
    if (run.length > 1) entities.push({ kind: "polyline", points: run, closed: false });
    run = [];
  };
  sub.segments.forEach((seg) => {
    if (seg.type === "line") {
      if (run.length === 0) run.push(tp(cursor));
      run.push(tp(seg.to));
    } else {
      flush();
      entities.push({ kind: "spline", ctrl: [tp(cursor), tp(seg.c1!), tp(seg.c2!), tp(seg.to)] });
    }
    cursor = seg.to;
  });
  flush();
  if (sub.closed) {
    const startPt = tp(sub.start);
    const lastPt = tp(cursor);
    if (Math.hypot(lastPt[0] - startPt[0], lastPt[1] - startPt[1]) > 1e-6) {
      entities.push({ kind: "line", a: lastPt, b: startPt });
    }
  }
  return entities;
}

function fillGeometryEntities(node: SceneNode): PEntity[] {
  const geo = (node as unknown as { fillGeometry?: VectorPaths }).fillGeometry;
  if (!geo || !geo.length) return [];
  const t = (node as unknown as { absoluteTransform: Transform }).absoluteTransform;
  const entities: PEntity[] = [];
  for (const path of geo) {
    for (const sub of parseFigmaPathData(path.data)) {
      entities.push(...subPathToEntities(sub, t));
    }
  }
  return entities;
}

// ---- per-node-type fast paths (exact geometry, no path parsing) ----

function ellipseEntities(node: EllipseNode): PEntity[] {
  const t = node.absoluteTransform;
  const rx = node.width / 2;
  const ry = node.height / 2;
  const center = applyPoint(t, rx, ry);
  const { startingAngle, endingAngle, innerRadius } = node.arcData;
  const fullSweep = endingAngle - startingAngle >= Math.PI * 2 - 1e-6;
  const isCircle = Math.abs(rx - ry) < 1e-6;

  const majorLocal: Pt = rx >= ry ? [rx, 0] : [0, ry];
  const majorAxis = applyVector(t, majorLocal[0], majorLocal[1]);
  const ratio = Math.min(rx, ry) / Math.max(rx, ry);

  // Combined partial-arc + donut ("pac-man ring") is uncommon and fiddly to hand-roll correctly;
  // fall back to the generic path parser rather than risk subtly-wrong bespoke geometry.
  if (innerRadius > 0 && !fullSweep) {
    return fillGeometryEntities(node);
  }

  if (innerRadius > 0) {
    const innerMajor: Pt = [majorAxis[0] * innerRadius, majorAxis[1] * innerRadius];
    return [
      isCircle
        ? { kind: "circle", c: center, r: rx }
        : { kind: "ellipse", c: center, majorAxis, ratio, startRad: 0, endRad: Math.PI * 2 },
      isCircle
        ? { kind: "circle", c: center, r: rx * innerRadius }
        : { kind: "ellipse", c: center, majorAxis: innerMajor, ratio, startRad: 0, endRad: Math.PI * 2 },
    ];
  }

  if (fullSweep) {
    return [
      isCircle
        ? { kind: "circle", c: center, r: rx }
        : { kind: "ellipse", c: center, majorAxis, ratio, startRad: 0, endRad: Math.PI * 2 },
    ];
  }

  // Pie slice: arc (or partial ellipse) plus the two radii back to center.
  const localPointAt = (theta: number): Pt => [rx + rx * Math.cos(theta), ry + ry * Math.sin(theta)];
  const startPt = applyPoint(t, ...localPointAt(startingAngle));
  const endPt = applyPoint(t, ...localPointAt(endingAngle));
  const curve: PEntity = isCircle
    ? {
        kind: "arc",
        c: center,
        r: rx,
        startDeg: (startingAngle * 180) / Math.PI,
        endDeg: (endingAngle * 180) / Math.PI,
      }
    : { kind: "ellipse", c: center, majorAxis, ratio, startRad: startingAngle, endRad: endingAngle };
  return [curve, { kind: "line", a: center, b: startPt }, { kind: "line", a: center, b: endPt }];
}

function getCornerRadii(node: RectangleNode): { tl: number; tr: number; br: number; bl: number } {
  const uniform = node.cornerRadius;
  if (typeof uniform === "number") return { tl: uniform, tr: uniform, br: uniform, bl: uniform };
  return {
    tl: node.topLeftRadius ?? 0,
    tr: node.topRightRadius ?? 0,
    br: node.bottomRightRadius ?? 0,
    bl: node.bottomLeftRadius ?? 0,
  };
}

function sampleArcLocal(cx: number, cy: number, r: number, fromDeg: number, toDeg: number, segs: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= segs; i++) {
    const a = ((fromDeg + (toDeg - fromDeg) * (i / segs)) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

// Sampled (not native-arc) rounded corners: stays correct under arbitrary node rotation,
// at the cost of faceting the rounded corners specifically (straight rects/circles/ellipses
// elsewhere still get exact native entities).
function roundedRectLocalPoints(w: number, h: number, tl: number, tr: number, br: number, bl: number): Pt[] {
  const SEGS = 8;
  const pts: Pt[] = [[tl, 0]];
  if (tr > 0) pts.push(...sampleArcLocal(w - tr, tr, tr, 270, 360, SEGS));
  else pts.push([w, 0]);
  if (br > 0) pts.push(...sampleArcLocal(w - br, h - br, br, 0, 90, SEGS));
  else pts.push([w, h]);
  if (bl > 0) pts.push(...sampleArcLocal(bl, h - bl, bl, 90, 180, SEGS));
  else pts.push([0, h]);
  if (tl > 0) pts.push(...sampleArcLocal(tl, tl, tl, 180, 270, SEGS));
  else pts.push([0, 0]);
  return pts;
}

function rectangleEntities(node: RectangleNode): PEntity[] {
  const t = node.absoluteTransform;
  const w = node.width;
  const h = node.height;
  const { tl, tr, br, bl } = getCornerRadii(node);
  const localPts =
    tl === 0 && tr === 0 && br === 0 && bl === 0
      ? ([[0, 0], [w, 0], [w, h], [0, h]] as Pt[])
      : roundedRectLocalPoints(w, h, tl, tr, br, bl);
  return [{ kind: "polyline", points: localPts.map((p) => applyPoint(t, p[0], p[1])), closed: true }];
}

function lineEntities(node: LineNode): PEntity[] {
  const t = node.absoluteTransform;
  return [{ kind: "line", a: applyPoint(t, 0, 0), b: applyPoint(t, node.width, 0) }];
}

function polygonEntities(node: PolygonNode | StarNode): PEntity[] {
  const t = node.absoluteTransform;
  const rx = node.width / 2;
  const ry = node.height / 2;
  const cx = rx;
  const cy = ry;
  const n = node.pointCount;
  const isStar = node.type === "STAR";
  const innerRatio = isStar ? (node as StarNode).innerRadius : 1;
  const total = isStar ? n * 2 : n;
  const step = isStar ? Math.PI / n : (2 * Math.PI) / n;
  const points: Pt[] = [];
  for (let i = 0; i < total; i++) {
    const angle = -Math.PI / 2 + i * step;
    const r = !isStar || i % 2 === 0 ? 1 : innerRatio;
    points.push(applyPoint(t, cx + rx * r * Math.cos(angle), cy + ry * r * Math.sin(angle)));
  }
  return [{ kind: "polyline", points, closed: true }];
}

function extractEntities(node: SceneNode): PEntity[] {
  switch (node.type) {
    case "RECTANGLE":
      return rectangleEntities(node);
    case "ELLIPSE":
      return ellipseEntities(node);
    case "LINE":
      return lineEntities(node);
    case "POLYGON":
    case "STAR":
      return polygonEntities(node);
    default:
      // VECTOR, BOOLEAN_OPERATION, TEXT: no exact primitive to read, use resolved fill geometry.
      return fillGeometryEntities(node);
  }
}

// ---- selection walking ----

function collectShapeNodes(selection: readonly SceneNode[]): SceneNode[] {
  const out: SceneNode[] = [];
  const visit = (node: SceneNode) => {
    if (CONTAINER_TYPES.has(node.type)) {
      for (const child of (node as unknown as ChildrenMixin).children) visit(child as SceneNode);
      return;
    }
    // Everything else (including BOOLEAN_OPERATION, whose children we intentionally skip since
    // its own fillGeometry already gives the resolved, boolean-combined outline) is a leaf.
    out.push(node);
  };
  selection.forEach(visit);
  return out;
}

// Figma's boolean/flatten operations often insert extra vertices along an otherwise-straight edge
// with only sub-pixel deviation (floating point jitter); collapse those into a single straight run
// so the DXF edge doesn't come out as a faceted zigzag.
function simplifyCollinear(points: Pt[], tolerance = 0.01): Pt[] {
  if (points.length < 3) return points;
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = out[out.length - 1];
    const [bx, by] = points[i];
    const [cx, cy] = points[i + 1];
    const dx = cx - ax;
    const dy = cy - ay;
    const len = Math.hypot(dx, dy);
    const dist = len === 0 ? Math.hypot(bx - ax, by - ay) : Math.abs(dy * (bx - ax) - dx * (by - ay)) / len;
    if (dist > tolerance) out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out;
}

function getSelectionBounds(selection: readonly SceneNode[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of selection) {
    const box = (node as unknown as { absoluteBoundingBox: Rect | null }).absoluteBoundingBox;
    if (!box) continue;
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

// ---- entrypoints ----

export function nodesToDxf(selection: readonly SceneNode[], scale = 1): string {
  const shapeNodes = collectShapeNodes(selection);
  const bounds = getSelectionBounds(selection);
  const mmPerPx = (MM_PER_INCH / SOURCE_DPI) * scale;

  // DXF is y-up, Figma/SVG is y-down: flip anchored at the selection's top edge, and negate
  // angles/vector-y-components accordingly wherever curves carry a direction.
  const toFinal = (p: Pt): Pt => [(p[0] - bounds.minX) * mmPerPx, (bounds.maxY - p[1]) * mmPerPx];

  const drawing = new Drawing();
  drawing.setUnits("Millimeters");

  for (const node of shapeNodes) {
    for (const e of extractEntities(node)) {
      switch (e.kind) {
        case "polyline":
          drawing.drawPolyline(simplifyCollinear(e.points.map(toFinal)), e.closed);
          break;
        case "line": {
          const [a, b] = [toFinal(e.a), toFinal(e.b)];
          drawing.drawLine(a[0], a[1], b[0], b[1]);
          break;
        }
        case "circle": {
          const c = toFinal(e.c);
          drawing.drawCircle(c[0], c[1], e.r * mmPerPx);
          break;
        }
        case "arc": {
          const c = toFinal(e.c);
          drawing.drawArc(c[0], c[1], e.r * mmPerPx, normalizeDeg(-e.endDeg), normalizeDeg(-e.startDeg));
          break;
        }
        case "ellipse": {
          const c = toFinal(e.c);
          const majorX = e.majorAxis[0] * mmPerPx;
          const majorY = -e.majorAxis[1] * mmPerPx;
          drawing.drawEllipse(
            c[0],
            c[1],
            majorX,
            majorY,
            e.ratio,
            normalizeRad(-e.endRad),
            normalizeRad(-e.startRad)
          );
          break;
        }
        case "spline":
          drawing.drawSpline(e.ctrl.map(toFinal), 3);
          break;
      }
    }
  }

  return drawing.toDxfString();
}

export interface DxfReadiness {
  available: boolean;
  note: string;
  openCount: number;
  totalCount: number;
}

// Rectangle/ellipse/polygon/star primitives are always closed loops; a bare line is always
// open; vector/boolean-op/text results are only closed if every fillGeometry subpath is.
export function analyzeDxfReadiness(selection: readonly SceneNode[]): DxfReadiness {
  const shapeNodes = collectShapeNodes(selection);
  if (!shapeNodes.length) {
    return { available: false, note: "No exportable geometry found", openCount: 0, totalCount: 0 };
  }

  let openCount = 0;
  for (const node of shapeNodes) {
    if (node.type === "LINE") {
      openCount++;
      continue;
    }
    if (node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "POLYGON" || node.type === "STAR") {
      continue;
    }
    const geo = (node as unknown as { fillGeometry?: VectorPaths }).fillGeometry;
    const allClosed = !!geo && geo.length > 0 && geo.every((p) => parseFigmaPathData(p.data).every((sp) => sp.closed));
    if (!allClosed) openCount++;
  }

  const totalCount = shapeNodes.length;
  const available = openCount === 0;
  const note = available
    ? `All ${totalCount} shape${totalCount === 1 ? "" : "s"} are closed — ready to export`
    : `${openCount} of ${totalCount} shape${totalCount === 1 ? "" : "s"} ${openCount === 1 ? "is" : "are"} open — DXF export needs closed loops`;
  return { available, note, openCount, totalCount };
}

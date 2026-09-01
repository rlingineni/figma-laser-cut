// Drill overlay: locate a template's through-holes from its rendered negative
// space, map each hole back to the real template layer element, and punch it
// into target nodes with a boolean SUBTRACT.

type BoundingBox = { x: number; y: number; width: number; height: number };

// The template may be a BooleanOperationNode directly, or a Component/Instance/
// Frame/Group that wraps one. Resolve to the underlying SUBTRACT boolean node.
function resolveBooleanSubtract(
  node: BaseNode
): BooleanOperationNode | null {
  if (
    node.type === "BOOLEAN_OPERATION" &&
    node.booleanOperation === "SUBTRACT"
  ) {
    return node;
  }
  if ("findOne" in node) {
    const found = (node as ChildrenMixin & BaseNode).findOne(
      (n) =>
        n.type === "BOOLEAN_OPERATION" &&
        (n as BooleanOperationNode).booleanOperation === "SUBTRACT"
    );
    return (found as BooleanOperationNode) ?? null;
  }
  return null;
}

// From a selection, pick the top-most (highest z-order) node that resolves to a
// boolean-subtract; that becomes the drill template.
export function findTemplateNode(selection: readonly SceneNode[]): SceneNode | null {
  const candidates = selection.filter((n) => resolveBooleanSubtract(n) !== null);
  if (!candidates.length) return null;
  return candidates.reduce((top, n) => {
    const topIndex = top.parent ? top.parent.children.indexOf(top) : -1;
    const nIndex = n.parent ? n.parent.children.indexOf(n) : -1;
    return nIndex > topIndex ? n : top;
  });
}

function boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Reparent a node into `parent` while preserving its absolute canvas position.
// Assumes unrotated parents (see plan's rotated-frame consideration).
function setAbsolutePosition(
  node: SceneNode,
  absX: number,
  absY: number,
  parent: BaseNode & ChildrenMixin
) {
  parent.appendChild(node);
  const parentBox =
    "absoluteBoundingBox" in parent
      ? (parent as unknown as { absoluteBoundingBox: BoundingBox | null })
          .absoluteBoundingBox
      : null;
  const originX = parentBox ? parentBox.x : 0;
  const originY = parentBox ? parentBox.y : 0;
  node.x = absX - originX;
  node.y = absY - originY;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[]
    );
  }
  return btoa(binary);
}

export interface TemplateImage {
  id: string;
  pngBase64: string;
  absX: number;
  absY: number;
  width: number;
  height: number;
}

// Render the template so the UI can locate its transparent (hole) regions.
// Scale is adaptive so the longest side lands near ~1024px for small-hole
// accuracy without exploding memory.
export async function exportTemplateImage(
  node: SceneNode
): Promise<TemplateImage | null> {
  const box = node.absoluteBoundingBox;
  if (!box) return null;
  const longest = Math.max(box.width, box.height) || 1;
  const scale = Math.min(8, Math.max(1, 1024 / longest));
  const bytes = await node.exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: scale },
  });
  return {
    id: node.id,
    pngBase64: bytesToBase64(bytes),
    absX: box.x,
    absY: box.y,
    width: box.width,
    height: box.height,
  };
}

// Find the real template descendant whose bounds tightly enclose a hole region;
// that node is cloned as the cutter so the cut uses the actual element.
function matchDescendant(
  template: BaseNode,
  region: BoundingBox
): SceneNode | null {
  if (!("findAll" in template)) return null;
  const candidates = (template as ChildrenMixin & BaseNode).findAll(
    (n) => "absoluteBoundingBox" in n && "clone" in n
  ) as SceneNode[];

  const cx = region.x + region.width / 2;
  const cy = region.y + region.height / 2;

  let best: SceneNode | null = null;
  let bestScore = Infinity;
  for (const n of candidates) {
    const b = n.absoluteBoundingBox;
    if (!b) continue;
    const contains =
      cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height;
    if (!contains) continue;
    // Prefer the tightest enclosing node (the hole shape, not the base/root).
    const sizeDiff =
      Math.abs(b.width - region.width) + Math.abs(b.height - region.height);
    const score = sizeDiff + b.width * b.height * 0.0001;
    if (score < bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best;
}

// For each target: (1) map hole regions to real descendant nodes, (2) clone and
// place them on the target, (3) run a boolean SUBTRACT (preserving the base
// layer's appearance and z-index).
export function applyDrillHoles(
  templateNode: BaseNode | null,
  holes: BoundingBox[],
  targets: SceneNode[]
): { punched: number; skipped: number; unmatched: number } {
  let punched = 0;
  let skipped = 0;

  if (!templateNode) {
    return { punched, skipped: targets.length, unmatched: holes.length };
  }

  // Map each hole region to its underlying element; dedupe shared nodes.
  const sourceById: { [id: string]: SceneNode } = {};
  let unmatched = 0;
  for (const region of holes) {
    const node = matchDescendant(templateNode, region);
    if (node) {
      sourceById[node.id] = node;
    } else {
      unmatched++;
    }
  }
  const sources = Object.keys(sourceById).map((id) => sourceById[id]);

  for (const target of targets) {
    const targetBox = target.absoluteBoundingBox;
    const parent = target.parent as (BaseNode & ChildrenMixin) | null;
    if (!targetBox || !parent) {
      skipped++;
      continue;
    }

    // (1) sources whose geometry falls within this target
    const overlapping = sources.filter((n) => {
      const b = n.absoluteBoundingBox;
      return b ? boundsIntersect(b, targetBox) : false;
    });
    if (!overlapping.length) {
      skipped++;
      continue;
    }

    // Remember where the target sits so the drilled result keeps its z-index.
    const originalIndex = parent.children.indexOf(target);

    // (2) clone the real hole elements and place them on the target
    const clones = overlapping.map((n) => {
      const clone = n.clone();
      const b = n.absoluteBoundingBox as BoundingBox;
      setAbsolutePosition(clone, b.x, b.y, parent);
      return clone;
    });

    // Preserve the base layer's appearance; the boolean result otherwise adopts
    // the template's style.
    const targetFills = "fills" in target ? target.fills : undefined;
    const targetStrokes = "strokes" in target ? target.strokes : undefined;
    const targetStrokeWeight =
      "strokeWeight" in target ? target.strokeWeight : undefined;

    // (3) boolean subtract (target is the base, clones cut away)
    const result = figma.subtract([target, ...clones], parent);
    if (targetFills !== undefined && targetFills !== figma.mixed) {
      result.fills = targetFills;
    }
    if (targetStrokes !== undefined) {
      result.strokes = targetStrokes;
    }
    if (targetStrokeWeight !== undefined && targetStrokeWeight !== figma.mixed) {
      result.strokeWeight = targetStrokeWeight;
    }

    // Restore the original stacking order (subtract moves the result to the top).
    if (originalIndex >= 0) {
      const clamped = Math.min(originalIndex, parent.children.length - 1);
      parent.insertChild(clamped, result);
    }
    punched++;
  }

  return { punched, skipped, unmatched };
}

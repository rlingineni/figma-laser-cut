// Drill overlay: punch a template's "cut away" holes into target nodes using
// absolute canvas position + a boolean SUBTRACT operation.

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

// The base shape is children[0]; the remaining children are the holes that get
// cut away.
function getHoleShapes(boolNode: BooleanOperationNode): SceneNode[] {
  return boolNode.children.slice(1);
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

export function captureTemplate(templateId: string, node: BaseNode | null) {
  if (!node) {
    return { id: templateId, name: "", holeCount: 0, valid: false };
  }
  const boolNode = resolveBooleanSubtract(node);
  if (!boolNode) {
    return { id: templateId, name: node.name, holeCount: 0, valid: false };
  }
  return {
    id: templateId,
    name: node.name,
    holeCount: getHoleShapes(boolNode).length,
    valid: true,
  };
}

// For each target: (1) get the subtract elements that overlap it, (2) clone and
// place them on the target, (3) run a boolean SUBTRACT.
export function overlayTemplate(
  templateNode: BaseNode | null,
  targets: SceneNode[]
): { punched: number; skipped: number } {
  let punched = 0;
  let skipped = 0;

  const boolNode = templateNode ? resolveBooleanSubtract(templateNode) : null;
  if (!boolNode) {
    return { punched, skipped: targets.length };
  }

  const holes = getHoleShapes(boolNode);

  for (const target of targets) {
    const targetBox = target.absoluteBoundingBox;
    const parent = target.parent as (BaseNode & ChildrenMixin) | null;
    if (!targetBox || !parent) {
      skipped++;
      continue;
    }

    // (1) subtract elements that fall within the target
    const overlapping = holes.filter((hole) => {
      const box = hole.absoluteBoundingBox;
      return box ? boundsIntersect(box, targetBox) : false;
    });

    if (!overlapping.length) {
      skipped++;
      continue;
    }

    // (2) clone the holes and place them on the target
    const clones = overlapping.map((hole) => {
      const clone = hole.clone();
      const box = hole.absoluteBoundingBox as BoundingBox;
      setAbsolutePosition(clone, box.x, box.y, parent);
      return clone;
    });

    // (3) boolean subtract (target is the base, clones cut away)
    figma.subtract([target, ...clones], parent);
    punched++;
  }

  return { punched, skipped };
}

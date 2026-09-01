export type FigmaMessageCommands =
  | "export-scaled-svg"
  | "export-scaled-png"
  | "insert-rectangle"
  | "apply-stroke-style"
  | "get-selected-nodes"
  | "set-node-dimensions"
  | "get-current-user"
  | "update-text"
  | "capture-drill-template"
  | "overlay-template"
  | "save-key"
  | "get-key";

export type FigmaEvents =
  | "on-selection-changed"
  | "currentpagechange"
  | "close";

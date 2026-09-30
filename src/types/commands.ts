export type FigmaMessageCommands =
  | "export-scaled-svg"
  | "export-scaled-png"
  | "export-dxf"
  | "is-dxf-available"
  | "insert-rectangle"
  | "apply-stroke-style"
  | "get-selected-nodes"
  | "set-node-dimensions"
  | "get-current-user"
  | "update-text"
  | "get-drill-template-image"
  | "apply-drill-holes"
  | "save-key"
  | "get-key";

export type FigmaEvents =
  | "on-selection-changed"
  | "currentpagechange"
  | "close";

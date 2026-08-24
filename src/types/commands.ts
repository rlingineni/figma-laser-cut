export type FigmaMessageCommands =
  | "export-scaled-svg"
  | "export-scaled-png"
  | "insert-rectangle"
  | "apply-stroke-style"
  | "get-selected-nodes"
  | "set-node-dimensions"
  | "get-current-user"
  | "update-text";

export type FigmaEvents =
  | "on-selection-changed"
  | "currentpagechange"
  | "close";

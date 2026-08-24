import * as React from "react";
import { Loader2 } from "lucide-react";

export default function Spinner() {
  return (
    <div role="status">
      <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

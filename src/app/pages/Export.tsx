import * as React from "react";
import { FigmaHelper } from "../utils/figma";
import { FigmaMessageCommands } from "../../types/commands";
import { Download, Copy, Check, Link, Loader2 } from "lucide-react";
import { createRoom, uploadFile, BASE_URL } from "../utils/APIHelper";

const ROOM_KEY = "cuts-room-id";
const figmaHelper = new FigmaHelper([]);

const Tooltip = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="relative group">
    {children}
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
      {label}
    </span>
  </div>
);

const Export = () => {
  const [selectedName, setSelectedName] = React.useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = React.useState<string | undefined>(undefined);
  const [previewSvg, setPreviewSvg] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const fetchPreview = React.useCallback(async (hasSelection: boolean) => {
    if (!hasSelection) { setPreviewSvg(null); return; }
    const dataUrl: string | null = await figmaHelper.run("export-scaled-png");
    setPreviewSvg(dataUrl ?? null);
  }, []);

  const figmaCommands = [
    {
      command: "on-selection-changed" as FigmaMessageCommands,
      onResponse: React.useCallback(async () => {
        const nodes = await figmaHelper.run("get-selected-nodes", { withMetadata: true });
        const single = nodes?.length === 1;
        setSelectedName(single ? nodes[0].name : null);
        setGeneratedLink('');
        await fetchPreview(single);
      }, [fetchPreview]),
    },
  ];

  const onInitialize = async () => {
    figmaHelper.addCommandHandlers(figmaCommands);
    const nodes = await figmaHelper.run("get-selected-nodes", { withMetadata: true });
    const single = nodes?.length === 1;
    setSelectedName(single ? nodes[0].name : null);
    await fetchPreview(single);
  };

  React.useEffect(() => {
    onInitialize();
  }, []);

  const downloadSvg = async () => {
    const results: { name: string; svg: string }[] = await figmaHelper.run("export-scaled-svg", { scale: 1 });
    results?.forEach(({ name, svg }) => {
      const a = document.createElement("a");
      a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      a.download = `${name}.svg`;
      a.click();
    });
  };

  const getShareLink = async (forceNewRoom = false) => {
    if (!selectedName) return;
    setIsUploading(true);
    try {
      let roomId: string = forceNewRoom ? null : await figmaHelper.run("get-key", { key: ROOM_KEY });
      if (!roomId) {
        const room = await createRoom();
        roomId = room.roomId;
        await figmaHelper.run("save-key", { key: ROOM_KEY, value: roomId });
      }
      const results: { name: string; svg: string }[] = await figmaHelper.run("export-scaled-svg", { scale: 1 });
      if (results?.length) {
        await uploadFile(roomId, results[0].name, results[0].svg);
      }
      setGeneratedLink(`${BASE_URL}/room/${roomId}`);
    } finally {
      setIsUploading(false);
    }
  };

  const copyLink = () => {
    if (!generatedLink) return;
    const el = document.createElement("textarea");
    el.value = generatedLink;
    el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col">
      <div className="px-3 pt-3">
        <p className="font-bold">Export SVG</p>
        <p className="text-xs my-2">
          Download files with scaled svg dimensions for compatibility
        </p>

        <div
          className="relative pattern-dots pattern-blue-500 pattern-bg-white pattern-size-2 w-full h-48 rounded-md overflow-hidden flex items-center justify-center mt-2"
        >
          {previewSvg ? (
            <img src={previewSvg} className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <p className="text-xs text-black font-bold">No selection</p>
          )}
        </div>
      </div>

      <div className="px-3">

        {selectedName && <div className="py-2 mt-2">

            <div className="flex justify-between items-center h-5">
              <p className="text-sm text-gray-700 mt-1 truncate flex items-center gap-1">
                {isUploading && <><Loader2 size={12} className="animate-spin shrink-0" /><span className="text-xs text-gray-400">uploading...</span></>}
                {!isUploading && (selectedName ?? "---")}
              </p>
              <div className="flex items-center gap-1">
                <Tooltip label="Get Share link">
                  <button onClick={() => getShareLink()} disabled={!selectedName || isUploading} className="disabled:opacity-40 bg-gray-200 p-1 rounded-sm">
                    <Link size={16} />
                  </button>
                </Tooltip>
                <Tooltip label="Download file">
                  <button onClick={downloadSvg} disabled={!selectedName} className="disabled:opacity-40 bg-gray-200 p-1 rounded-sm">
                    <Download size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>
                 
        </div>}

        {generatedLink && true &&
          <div>
            <div className="bg-gray-100 rounded-md p-4">
              <p className="text-[12px] mb-3">access your uploads from another computer</p>
              <div className="bg-white px-2 py-1 my-2 rounded-sm flex items-center justify-between gap-1">
                <a href={generatedLink} target="_blank" className="flex items-baseline gap-0.5 min-w-0">
                  <span className="text-[10px] text-gray-400 shrink-0">{generatedLink.replace(/^https?:\/\//, "").replace(/\/[^\/]+$/, "/")}</span>
                  <span className="text-xs font-semibold truncate">{generatedLink.split("/").pop()}</span>
                </a>
                <button onClick={copyLink} title="Copy link" className="shrink-0 text-gray-400 hover:text-gray-700 ml-1">
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  );
};

export default Export;

import * as React from "react";
import { FigmaHelper } from "../utils/figma";
import { FigmaMessageCommands } from "../../types/commands";
import { Download } from "lucide-react";

const figmaHelper = new FigmaHelper([]);

const Export = () => {
  const [selectedName, setSelectedName] = React.useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = React.useState<string | undefined>(undefined);
  const [previewSvg, setPreviewSvg] = React.useState<string | null>(null);

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

  const exportScaledSvg = async () => {
    const results: { name: string; svg: string }[] =
      await figmaHelper.run("export-scaled-svg", { scale: 1 });
    if (!results?.length) return;
    results.forEach(({ name, svg }) => {
      const a = document.createElement("a");
      a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      a.download = `${name}.svg`;
      a.click();
    });
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

        {selectedName && <div className="py-2">

            <div className="flex justify-between items-center h-5">
              <p className="text-sm text-gray-700 mt-2 truncate">{selectedName ? selectedName : "---"}
              </p>
              <button onClick={exportScaledSvg} disabled={!selectedName} className="disabled:opacity-40">
                <Download size={16} />
              </button>

        
            </div>
             <button
          className={`text-xs mt-4 truncate ${selectedName ? "underline" : "text-gray-400 cursor-default"}`}
          disabled={!selectedName}
          onClick={() => { setGeneratedLink('link') }}
        >
          get share link
        </button>
                 
        </div>}

        {generatedLink && selectedName &&
          <div>
            <div className="bg-gray-100 rounded-md p-4 mt-4">
  <p className="text-[12px] mb-3">access your uploads from another computer</p>
       
              <div className="bg-white px-2 py-1 my-2 rounded-sm">
               <p className="text-xs underline">figcuts.com/link/raspberry-blue-straw</p>
              </div>
  

            


            </div>


          </div>
        }

      </div>
    </div>
  );
};

export default Export;

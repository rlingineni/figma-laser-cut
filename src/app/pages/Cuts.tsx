import * as React from "react";
import { FigmaHelper } from "../utils/figma";
import Tabs from "../components/Tabs";
import { detectHoles } from "../utils/holeDetection";
import explainImage from "../assets/base64/explainImage";
import { Loader2 } from "lucide-react";

const Page2 = () => {
  const [selectedTab, setSelectedTab] = React.useState("Strokes");
  const [rasterPercent, setRasterPercent] = React.useState<number>(0);
  const [drillStatus, setDrillStatus] = React.useState<string>("");
  const [holeCount, setHoleCount] = React.useState<number | null>(null);
  const [baseLayerCount, setBaseLayerCount] = React.useState<number>(0);
  const [checkingTemplate, setCheckingTemplate] = React.useState(false);

  const [figmaHelper] = React.useState(new FigmaHelper([]));
  const applyStrokeStyle = (
    color: { r: number; g: number; b: number; a: number },
    thickness: number,
    opts?: { useFill?: boolean }
  ) => {
    figmaHelper.run("apply-stroke-style", { color, thickness, opts });
  };

  const refreshTemplatePreview = React.useCallback(async () => {
    setCheckingTemplate(true);
    try {
      const image = await figmaHelper.run("get-drill-template-image");
      if (!image || image.noTemplate) {
        setHoleCount(null);
        setBaseLayerCount(0);
        return;
      }
      const holes = await detectHoles(image.pngBase64, {
        x: image.absX,
        y: image.absY,
        width: image.width,
        height: image.height,
      });
      setHoleCount(holes.length);
      setBaseLayerCount(image.baseLayerCount ?? 0);
    } finally {
      setCheckingTemplate(false);
    }
  }, [figmaHelper]);

  React.useEffect(() => {
    figmaHelper.addCommandHandlers([
      {
        command: "on-selection-changed",
        onResponse: () => {
          setDrillStatus("");
          refreshTemplatePreview();
        },
      },
    ]);
    refreshTemplatePreview();
  }, [figmaHelper, refreshTemplatePreview]);

  const applyDrills = async () => {
    const image = await figmaHelper.run("get-drill-template-image");
    if (!image || image.noTemplate) {
      setDrillStatus(
        "No subtract template in selection. Select a boolean-subtract shape plus the shapes behind it."
      );
      return;
    }

    const holes = await detectHoles(image.pngBase64, {
      x: image.absX,
      y: image.absY,
      width: image.width,
      height: image.height,
    });
    if (!holes.length) {
      setDrillStatus("No holes detected in the template.");
      return;
    }

    const result = await figmaHelper.run("apply-drill-holes", {
      templateId: image.id,
      holes,
    });
    await refreshTemplatePreview();
    const unmatched = result?.unmatched
      ? `, ${result.unmatched} hole(s) unmatched`
      : "";
    setDrillStatus(
      `Punched ${result?.punched ?? 0} node(s), skipped ${result?.skipped ?? 0
      }${unmatched}.`
    );
  };

  const getPreviewText = (): string => {
    const status: "no-template" | "no-holes" | "ready" =
      holeCount === null ? "no-template" : holeCount === 0 ? "no-holes" : "ready";

    switch (status) {
      case "no-template":
        return "Select a template and a few shapes";
      case "no-holes":
        return "No holes detected in the template";
      case "ready":
        return `${holeCount} hole${holeCount === 1 ? "" : "s"} detected${
          baseLayerCount > 0
            ? ` | ${baseLayerCount} base layer${baseLayerCount === 1 ? "" : "s"}`
            : ""
        }`;
    }
  };

  const grayShade = 200 * (rasterPercent / 100);

  return (
    <div className="px-3 pt-3">
      <Tabs
        tabs={["Strokes", "Drills"]}
        selected={selectedTab}
        onSelect={setSelectedTab}
      />
      {selectedTab === "Strokes" && (
        <div className="mt-3">

          <p className="text-xs">
            Apply a stroke style to your shapes so the laser machine knows what
            operation to do.
          </p>

          <div className="flex flex-col gap-1 mt-4">
            <div className="w-full my-2">
              <p className="text-xs">r:255, g:0, b:0, w: .01</p>
              <button
                className="bg-red-400 rounded-sm px-2 py-1 mt-2 text-sm w-full"
                onClick={() => {
                  applyStrokeStyle({ r: 255, g: 0, b: 0, a: 1 }, 0.01);
                }}
              >
                Apply Cut
              </button>
            </div>

            <div className="w-full my-2">
              <p className="text-xs">r:0, g:0, b:255, w: .01</p>
              <button
                className="bg-blue-400 rounded-sm px-2 py-1 mt-2 text-sm w-full"
                onClick={() => {
                  applyStrokeStyle({ r: 0, g: 0, b: 255, a: 1 }, 0.01);
                }}
              >
                Apply Engrave
              </button>
            </div>

            <div className="w-full my-2 flex flex-col gap-2">
              <div className="flex justify-between">
                <p className="text-xs">r:0, g:0, b:0, w: .01</p>
                <p className="text-xs">{rasterPercent}%</p>
              </div>

              <input
                id="default-range"
                type="range"
                onChange={(e) => setRasterPercent(parseInt(e.target.value))}
                value={rasterPercent}
                style={{
                  background: `rgba(${grayShade}, ${grayShade}, ${grayShade}, 1)`,
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              ></input>
              <button
                className="bg-gray-400 rounded-sm px-2 py-1 mt-2 text-sm w-full"
                onClick={() => {
                  applyStrokeStyle(
                    { r: grayShade, g: grayShade, b: grayShade, a: 1 },
                    1,
                    {
                      useFill: false,
                    }
                  );
                }}
              >
                Apply Gray Shade
              </button>
            </div>
          </div>




        </div>
      )}
      {selectedTab === "Drills" && (
        <div className="mt-3">

          <p className="text-xs">
            Drills holes through the underlying layers. Use holes from one layer as a template and drills through the others
          </p>

           <p className="mt-3 text-[8px] text-gray-500">Example Image</p>

          <div className="relative">
           
            <img
              src={explainImage}
              className="max-h-full max-w-full object-contain"
            />
          </div>


          <div className="flex flex-col gap-1 mt-4">
            <button
              className="bg-red-400 rounded-sm px-2 py-1 mt-2 text-sm w-full disabled:opacity-40 disabled:bg-gray-300 flex items-center justify-center gap-1"
              onClick={applyDrills}
              disabled={checkingTemplate || !holeCount}
            >
              {checkingTemplate && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Apply Drills
            </button>

            <p className="text-xs text-gray-500 mt-1">{getPreviewText()}</p>

            {drillStatus && <p className="text-xs mt-2">{drillStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page2;

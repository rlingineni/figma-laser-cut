import * as React from "react";
import { FigmaHelper } from "../utils/figma";
import Tabs from "../components/Tabs";

const Page2 = () => {
  const [selectedTab, setSelectedTab] = React.useState("Strokes");
  const [rasterPercent, setRasterPercent] = React.useState<number>(0);
  const [template, setTemplate] = React.useState<{
    id: string;
    name: string;
    holeCount: number;
  } | null>(null);
  const [drillStatus, setDrillStatus] = React.useState<string>("");

  const [figmaHelper] = React.useState(new FigmaHelper([]));
  const applyStrokeStyle = (
    color: { r: number; g: number; b: number; a: number },
    thickness: number,
    opts?: { useFill?: boolean }
  ) => {
    figmaHelper.run("apply-stroke-style", { color, thickness, opts });
  };

  const captureTemplate = async () => {
    const result = await figmaHelper.run("capture-drill-template");
    if (result?.valid) {
      setTemplate({
        id: result.id,
        name: result.name,
        holeCount: result.holeCount,
      });
      setDrillStatus("");
    } else {
      setTemplate(null);
      setDrillStatus(
        "Selected item isn't a boolean-subtract template. Select the subtract shape and try again."
      );
    }
  };

  const applyTemplate = async () => {
    if (!template) return;
    const result = await figmaHelper.run("overlay-template", {
      templateId: template.id,
    });
    setDrillStatus(
      `Punched ${result?.punched ?? 0} node(s), skipped ${
        result?.skipped ?? 0
      }.`
    );
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
      <div className="mt-5">
        
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
        <div className="mt-5">
          <p className="text-xs">
            Drill through-holes from a subtract template onto the shapes behind
            it.
          </p>

          <div className="flex flex-col gap-1 mt-4">
            <div className="w-full my-2">
              <p className="text-xs font-bold">Step 1: Select template</p>
              <p className="text-xs">
                {template
                  ? `Loaded: ${template.name} (${template.holeCount} holes)`
                  : "Select the subtract shape, then load it."}
              </p>
              <button
                className="bg-gray-200 rounded-sm px-2 py-1 mt-2 text-sm w-full"
                onClick={captureTemplate}
              >
                {template ? "Reload Template" : "Load Template"}
              </button>
            </div>

            <div className="w-full my-2">
              <p className="text-xs font-bold">Step 2: Apply to selection</p>
              <p className="text-xs">
                Select the shapes behind the template, then apply.
              </p>
              <button
                className="bg-red-400 rounded-sm px-2 py-1 mt-2 text-sm w-full disabled:opacity-50"
                disabled={!template}
                onClick={applyTemplate}
              >
                Apply Drills
              </button>
            </div>

            {drillStatus && <p className="text-xs mt-2">{drillStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page2;

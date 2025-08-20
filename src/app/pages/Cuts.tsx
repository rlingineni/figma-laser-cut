import * as React from "react";
import { FigmaHelper } from "../utils/figma";

const Page2 = () => {
  const [rasterPercent, setRasterPercent] = React.useState<number>(0);

  const [figmaHelper] = React.useState(new FigmaHelper([]));
  const applyStrokeStyle = (
    color: { r: number; g: number; b: number; a: number },
    thickness: number,
    opts?: { useFill?: boolean }
  ) => {
    figmaHelper.run("apply-stroke-style", { color, thickness, opts });
  };

  const grayShade = 200 * (rasterPercent / 100);

  return (
    <div>
      <div className="px-3 pt-3">
        <p className="font-bold">Stroke Styles</p>
        <p className="text-xs">
          Apply a stroke style to your shapes so the laser machine knows what
          operation to do.
        </p>

        <div className="flex flex-col gap-4">
          <div className="w-full my-4 ">
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

          <div className="w-full my-4">
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

          <div className="w-full my-4 flex flex-col gap-2">
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
    </div>
  );
};

export default Page2;

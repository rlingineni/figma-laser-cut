import * as React from "react";
import UnitsConverter from "../components/Converter";
import { FigmaHelper } from "../utils/figma";

const Spacer = () => {
  const [figmaHelper] = React.useState(new FigmaHelper([]));
  const [selectedUnit, setSelectedUnit] = React.useState<
    "cm" | "mm" | "inches"
  >("mm");
  const [pixelWidth, setPixelWidth] = React.useState<number>(50);
  const [pixelHeight, setPixelHeight] = React.useState<number>(50);
  const [rawHeight, setRawHeight] = React.useState<number>(0);
  const [rawWidth, setRawWidth] = React.useState<number>(0);

  const onChange = (
    value: { pixels: number; raw: number },
    units: "cm" | "mm" | "inches",
    type: "height" | "width"
  ) => {
    if (type === "height") {
      setPixelHeight(value.pixels);
      setRawHeight(value.raw);
    } else {
      setPixelWidth(value.pixels);
      setRawWidth(value.raw);
    }
  };

  return (
    <div>
      <div className="px-3 pt-3">
        <p className="font-bold">Spacers</p>
        <p className="text-xs mt-3">
          Generate spacers/rulers in your design to help scale and align your
          designs correctly.
        </p>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center">
            <div
              className="relative pattern-dots pattern-blue-500 pattern-bg-white 
              pattern-size-2 w-72 h-64"
            >
              <div
                className="absolute top-0 left-0 bg-red-600 rounded-md flex flex-col items-center justify-center text-sm"
                style={{
                  height: pixelHeight > 250 ? 250 : pixelHeight,
                  width: pixelWidth > 290 ? 290 : pixelWidth,
                }}
              >
                {/* <h1>
                  {pixelHeight}x{pixelWidth}
                </h1> */}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <UnitsConverter
              onSelectedUnitChange={setSelectedUnit}
              selectedUnit={selectedUnit}
              pixelHeight={pixelHeight}
              pixelWidth={pixelWidth}
              onChange={onChange}
            />
          </div>

          <div className="w-full">
            <button
              className="bg-red-200 rounded-sm px-2 py-1 mt-2 text-sm w-full"
              onClick={() => {
                figmaHelper.run("insert-rectangle", {
                  width: pixelWidth,
                  height: pixelHeight,
                  rawHeight,
                  rawWidth,
                  unit: selectedUnit,
                });
              }}
            >
              Insert Spacer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spacer;

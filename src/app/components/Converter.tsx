import * as React from "react";

export const roundNum = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100;

type UnitsConverterProps = {
  onChange: (
    value: { pixels: number; raw: number },
    units: "cm" | "mm" | "inches",
    type: "height" | "width"
  ) => void;
  onSelectedUnitChange: (unit: "cm" | "mm" | "inches") => void;
  selectedUnit: "cm" | "mm" | "inches";
  pixelWidth: number;
  pixelHeight: number;
};

// linear conversion
// 	2.834 px = 1 mm at 72 DPI

const BASE_UNIT = 2.834;

const UnitsConverter = ({
  selectedUnit,
  pixelWidth,
  pixelHeight,
  onChange,
  onSelectedUnitChange,
}: UnitsConverterProps) => {
  const availUnits: Array<"cm" | "mm" | "inches"> = ["mm", "cm", "inches"];

  /**
   * Convert the pixels to the given units
   * @param pixel Conv
   * @param unit
   * @returns
   */
  const pixelToUnit = (pixel: number, unit: "cm" | "mm" | "inches"): number => {
    if (unit === "cm") {
      return roundNum((pixel / BASE_UNIT) * 10);
    }
    if (unit === "mm") {
      return roundNum(pixel / BASE_UNIT);
    }
    if (unit === "inches") {
      return roundNum(pixel / (BASE_UNIT * 10) / 2.54);
    }
  };

  const convertToPixels = (value: number, unit: "cm" | "mm" | "inches") => {
    if (unit === "cm") {
      return roundNum(value * BASE_UNIT * 10);
    }
    if (unit === "mm") {
      return roundNum(value * BASE_UNIT);
    }
    if (unit === "inches") {
      return roundNum(value * (BASE_UNIT * 10) * 2.54);
    }
  };

  React.useEffect(() => {
    handleInputChange(
      "height",
      pixelToUnit(pixelHeight, selectedUnit).toString()
    );
    handleInputChange(
      "width",
      pixelToUnit(pixelWidth, selectedUnit).toString()
    );
  }, [selectedUnit]);

  const handleInputChange = (type: "height" | "width", value: string) => {
    const unitsValue = parseFloat(value);
    const pixelValue = convertToPixels(unitsValue, selectedUnit);
    const convertedValue = pixelToUnit(pixelValue, selectedUnit);
    onChange({ pixels: pixelValue, raw: convertedValue }, selectedUnit, type);
  };

  return (
    <div>
      <div>
        <div className="inline-flex rounded-md shadow-sm text-sm" role="group">
          {availUnits.map((unitType, index) => (
            <button
              key={unitType + "-" + selectedUnit}
              type="button"
              onClick={() => onSelectedUnitChange(unitType)}
              className={`px-2 py-1 text-xs font-medium text-gray-900 border border-gray-200 ${
                index === 0 ? "rounded-l-lg" : index === 2 ? "rounded-r-lg" : ""
              } ${
                selectedUnit === unitType ? "bg-gray-100" : "bg-white"
              } hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700`}
            >
              {unitType}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full flex flex-col gap-4 mt-4">
        <div className="flex">
          <p className="font-bold text-xs mr-4">Width:&nbsp;</p>
          <input
            type="number"
            value={pixelToUnit(pixelWidth, selectedUnit)}
            onChange={(e) => handleInputChange("width", e.target.value)}
            className="border-gray-200 border-b outline-none w-16 h-4 text-xs mr-1 rounded-sm "
          />
          <p className="text-xs">{selectedUnit}</p>
        </div>
        <div className="flex">
          <p className="font-bold text-xs mr-4">Height: </p>
          <input
            type="number"
            value={pixelToUnit(pixelHeight, selectedUnit)}
            onChange={(e) => handleInputChange("height", e.target.value)}
            className="border-gray-200 border-b outline-none w-16 h-4 text-xs mr-1 rounded-sm"
          />
          <p className="text-xs">{selectedUnit}</p>
        </div>
      </div>
    </div>
  );
};

export default UnitsConverter;

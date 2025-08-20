import * as React from "react";
import UnitsConverter, { roundNum } from "../components/Converter";
import { FigmaHelper } from "../utils/figma";
import { FigmaMessageCommands } from "../../types/commands";
import { useEffect } from "react";

const figmaHelper = new FigmaHelper([]);

type FigmaNode = {
  id: string;
  name: string;
  documentId: string;
  pageId: string;
  width: number;
  height: number;
  pluginData?: { key: string; value: string }[];
};

const Converter = () => {
  const [selectedUnit, setSelectedUnit] = React.useState<
    "cm" | "mm" | "inches"
  >("mm");
  const [pixelWidth, setPixelWidth] = React.useState<number>(0);
  const [pixelHeight, setPixelHeight] = React.useState<number>(0);
  const [selectedNodes, setSelectedNodes] = React.useState<FigmaNode[]>([]);

  const figmaCommands = [
    {
      command: "on-selection-changed" as FigmaMessageCommands,
      onResponse: React.useCallback(async () => {
        const nodes = (await figmaHelper.run("get-selected-nodes", {
          withMetadata: true,
        })) as FigmaNode[];
        console.log(nodes);
        setSelectedNodes(nodes);
        if (nodes.length === 1) {
          setPixelHeight(nodes[0].height);
          setPixelWidth(nodes[0].width);
        }
      }, []),
    },
  ];

  const onInitialize = async () => {
    let nodes: FigmaNode[] = [];

    figmaHelper.addCommandHandlers(figmaCommands);

    nodes = (await figmaHelper.run("get-selected-nodes", {
      withMetadata: true,
    })) as FigmaNode[];
    console.log("INIT...");
    setSelectedNodes(nodes);
    if (nodes.length === 1) {
      setPixelHeight(nodes[0].height);
      setPixelWidth(nodes[0].width);
    }
  };

  useEffect(() => {
    onInitialize();
  }, []);

  const updateNode = (id: string, width?: number, height?: number) => {
    figmaHelper.run("set-node-dimensions", { id: id, height, width });
  };

  const onChange = (
    value: { pixels: number; raw: number },
    units: "cm" | "mm" | "inches",
    type: "height" | "width"
  ) => {
    if (type === "height") {
      setPixelHeight(value.pixels);
      if (selectedNodes.length === 1) {
        updateNode(selectedNodes[0].id, undefined, value.pixels);
      }
    } else {
      setPixelWidth(value.pixels);
      if (selectedNodes.length === 1) {
        updateNode(selectedNodes[0].id, value.pixels);
      }
    }
  };

  return (
    <div>
      <div className="px-3 pt-3">
        <p className="font-bold">Ruler</p>
        <p className="text-xs mt-4">
          Apply and measure real height and width units to your figma shapes and
          objects
        </p>

        <div className="flex items-center mt-4">
          <div
            className="relative pattern-dots pattern-blue-500 pattern-bg-white 
              pattern-size-2 w-72 h-72"
          >
            <div className="absolute top-2 left-0 w-72 h-64 rounded-md">
              <div className="w-full h-full flex items-center justify-center text-sm">
                <div
                  className={`${
                    selectedNodes.length === 0 ? "bg-blue-200" : "bg-red-200"
                  } h-64 w-64 flex flex-col items-center justify-center`}
                >
                  {selectedNodes.length === 0 && <h1>Select an object</h1>}
                  {selectedNodes.length === 1 && (
                    <h1>
                      {roundNum(pixelWidth)} x {roundNum(pixelHeight)}
                    </h1>
                  )}
                  {selectedNodes.length > 1 && (
                    <h1>
                      Please select only <b>one</b> object
                    </h1>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {selectedNodes.length === 1 && (
            <UnitsConverter
              onSelectedUnitChange={setSelectedUnit}
              selectedUnit={selectedUnit}
              pixelHeight={pixelHeight}
              pixelWidth={pixelWidth}
              onChange={onChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Converter;

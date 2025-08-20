import { FigmaEvents, FigmaMessageCommands } from "../types/commands";

interface FigmaCommandDetails {
  command: FigmaMessageCommands | FigmaEvents;
  requestId?: string;
}

export interface FigmaUIMessage {
  commandDetails: FigmaCommandDetails;
  args: any;
  customCommand?: boolean;
}

const PREVIEW_ENV = process.env.PREVIEW_ENV;

figma.showUI(__html__);

if (PREVIEW_ENV === "figma") {
  figma.ui.resize(300, 200);
} else {
  figma.ui.resize(320, 600);
}

// generate a message with the data for the UI
function sendResponse(commandDetails: FigmaCommandDetails, data: any) {
  const msg = {
    command: commandDetails.command,
    data,
    requestId: commandDetails.requestId,
  };

  figma.ui.postMessage(msg);
}

figma.on("selectionchange", () => {
  sendResponse({ command: "on-selection-changed" }, "");
});

const figmaRGB = (num) => num / 255;

figma.ui.onmessage = async (msg: FigmaUIMessage) => {
  const { commandDetails, args } = msg;
  if (!commandDetails.command) return;
  try {
    switch (commandDetails.command) {
      case "apply-stroke-style":
        {
          // apply a stroke style to the selected nodes
          const {
            color: { r, g, b, a },
            thickness,
            opts,
          } = args;
          const nodes = figma.currentPage.selection;
          const paint: SolidPaint = {
            type: "SOLID",
            color: { r: figmaRGB(r), g: figmaRGB(g), b: figmaRGB(b) },
            opacity: a,
          };
          nodes.forEach((node) => {
            if ("strokes" in node) {
              node.strokes = [paint];
              node.strokeWeight = thickness;
            }
            if (opts.useFill) {
              if ("fills" in node) {
                node.fills = [paint];
              }
            }
          });
          sendResponse(msg.commandDetails, true);
        }
        break;
      case "insert-rectangle":
        {
          const { width, height, rawHeight, rawWidth, unit } = args;
          // create a rectangle on the canvas
          const rect = figma.createRectangle();

          // if there's an item selected, add the rectangle next to it

          rect.fills = [
            {
              type: "SOLID",
              color: {
                r: figmaRGB(255),
                g: figmaRGB(202),
                b: figmaRGB(202),
              },
            },
          ] as SolidPaint[];
          rect.resize(width, height);

          if (figma.currentPage.selection.length === 1) {
            const selectedNode = figma.currentPage.selection[0];
            rect.x = selectedNode.x + selectedNode.width + 10;
            rect.y = selectedNode.y;
          } else {
            rect.x = figma.viewport.center.x;
            rect.y = figma.viewport.center.y;
          }

          figma.currentPage.appendChild(rect);

          // add text to the center of the rectangle
          const text = figma.createText();

          await figma.loadFontAsync(text.fontName as FontName);
          text.fontSize = Math.max(Math.round(Math.min(width, height) / 10), 5);
          text.textAlignHorizontal = "CENTER";
          text.textAlignVertical = "CENTER";
          text.resize(width, height);
          text.x = rect.x;
          text.y = rect.y;
          text.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
          text.characters = `${rawWidth}x${rawHeight} ${unit}`;

          text.name = "Dimensions";

          figma.currentPage.appendChild(text);

          // group the two
          const group = figma.group([rect, text], figma.currentPage);
          group.name = `${rawWidth}x${rawHeight}${unit} Spacer`;


          // add group to the center of the viewport
          figma.currentPage.appendChild(group);
          figma.currentPage.selection = [group];
          figma.viewport.scrollAndZoomIntoView([group]);
          sendResponse(msg.commandDetails, group);
        }
        break;
      case "get-selected-nodes":
        {
          {
            let nodes = figma.currentPage.selection as any[];
            if (msg.args.withMetadata) {
              nodes = nodes.map((n) => ({
                documentId: figma.root.id,
                pageId: figma.currentPage.id,
                name: figma.getNodeById(n.id).name,
                width: n.width,
                height: n.height,
                pluginData: n
                  .getPluginDataKeys()
                  .map((k) => ({ key: k, value: n.getPluginData(k) })),
                id: n.id,
              }));
            }
            sendResponse(msg.commandDetails, nodes);
          }
        }
        break;
      case "set-node-dimensions": {
        const { id, width, height } = args;
        const node = figma.getNodeById(id) as RectangleNode;
        if (width) {
          node.resize(width, node.height);
        }
        if (height) {
          node.resize(node.width, height);
        }
        sendResponse(msg.commandDetails, true);
      }
      case "update-text":
        {
          const { id, text } = args;
          const textNode = <TextNode>figma.getNodeById(id);

          await Promise.all(
            textNode
              .getRangeAllFontNames(0, textNode.characters.length)
              .map(figma.loadFontAsync)
          );

          textNode.characters = text;
          sendResponse(msg.commandDetails, true);
        }
        break;
      case "get-current-user":
        {
          sendResponse(msg.commandDetails, {
            ...figma.currentUser,
            fileKey: figma.fileKey,
          });
        }
        break;
    }
  } catch (ex) {
    console.log(ex);
  }
};

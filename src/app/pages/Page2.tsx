import * as React from "react";
import { PageHeader } from "../components/Header";

const Page2 = () => {
  return (
    <div>
      <div className="px-3 pt-3">
        <p className="font-bold">Stroke Styles</p>
        <p className="text-xs">Apply a stroke style to your shapes so the laser machine knows what operation to do.</p>

        <div className="flex flex-col gap-4">
          
          <div className="w-full my-4 ">
            <p className="text-xs">r:255, g:0, b:0, w: .01</p>
            <button className="bg-red-400 rounded-sm px-2 py-1 mt-2 text-sm w-full">
              Apply Cut
            </button>
          </div>

          <div className="w-full my-4">
            <p className="text-xs">r:0, g:0, b:255, w: .01</p>
            <button className="bg-blue-400 rounded-sm px-2 py-1 mt-2 text-sm w-full">
              Apply Engrave
            </button>
          </div>

          <div className="w-full my-4 flex flex-col gap-2">
            <p className="text-xs">r:0, g:0, b:0, w: .01</p>
            <input id="default-range" type="range" value="0" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"></input>
            <button className="bg-gray-400 rounded-sm px-2 py-1 mt-2 text-sm w-full">
              Apply Raster
            </button>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default Page2;

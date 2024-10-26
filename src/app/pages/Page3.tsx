import * as React from "react";

const Page3 = () => {
  return (
    <div>
      <div className="px-3 pt-3">
        <p className="font-bold">Converter</p>
        <p className="text-xs mt-4">
          Apply real units to the height and widths of your figma shapes and
          objects
        </p>

        <div className="flex items-center mt-4">
          <div
            className="relative pattern-dots pattern-blue-500 pattern-bg-white 
              pattern-size-2 w-72 h-72"
          >
            <div className="absolute top-0 left-0 w-72 h-72 rounded-md">
              <div className="w-full h-full flex items-center justify-center text-sm">
                <div className="bg-red-200 h-64 w-64 flex flex-col items-center justify-center">
                  <h1>Select an object</h1>
                  <h1>240 x 1320</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            className="inline-flex rounded-md shadow-sm text-sm mt-4"
            role="group"
          >
            <button
              type="button"
              className="px-2 py-1 text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700"
            >
              cm
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 "
            >
              mm
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700  "
            >
              inches
            </button>
          </div>
        </div>
        <div className="w-full flex flex-col gap-4 mt-4">
          <div className="flex">
            <p className="font-bold text-xs mr-4">Length: </p>
            <input
              type="number"
              value={5}
              className="border-gray-200 border-b outline-none w-8 h-4 text-xs mr-1 rounded-sm"
            />
            <p className="text-xs">mm</p>
          </div>
          <div className="flex">
            <p className="font-bold text-xs mr-4">Width:&nbsp;&nbsp;</p>
            <input
              type="text"
              className="border-gray-200 border-b outline-none w-8 h-4 text-xs mr-1 rounded-sm"
            />
            <p className="text-xs">mm</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page3;

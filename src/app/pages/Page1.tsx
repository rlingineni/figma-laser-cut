import * as React from "react";
import { PageHeader } from "../components/Header";

const Page1 = () => {
  return (
    <div>
      <div className="px-3 pt-3">
        <p className="font-bold">Spacers</p>
        <p className="text-xs mt-3">
          Generate spacers/rulers in your design to help scale and align your designs
          correctly.
        </p>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center">
            <div
              className="relative pattern-dots pattern-blue-500 pattern-bg-white 
              pattern-size-2 w-72 h-72"
            >
              <div className="absolute top-0 left-0 bg-red-200 h-20 w-20 rounded-md">
                <h1></h1>
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col gap-4 ">
            <div className="flex">
              <p className="font-bold text-xs mr-4">Length: </p>
              <input type="number" value={5} className="border-gray-200 border-b outline-none w-8 h-4 text-xs mr-1 rounded-sm" />
              <p className="text-xs">mm</p>
            </div>
            <div className="flex">
              <p className="font-bold text-xs mr-4">Width:&nbsp;</p>
              <input type="text" className="border-gray-200 border-b outline-none w-8 h-4 text-xs mr-1 rounded-sm" />
              <p className="text-xs">mm</p>
            </div>
          </div>
          <div className="w-full my-4 ">
            <button className="bg-red-200 rounded-sm px-2 py-1 mt-2 text-sm w-full">
              Insert Spacer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page1;

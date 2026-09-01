import cx from "classnames";
import * as React from "react";

type TabsProps = {
  tabs: string[];
  selected: string;
  onSelect: (tab: string) => void;
};

const Tabs = ({ tabs, selected, onSelect }: TabsProps) => {
  return (
    <div className="flex w-full  border-gray-200 my-2">
      {tabs.map((tab, index) => (
        <React.Fragment key={tab}>
          {index > 0 && <span className="text-gray-300 px-1">|</span>}
          <button
            type="button"
            onClick={() => onSelect(tab)}
            className={cx(
              "px-1 -mb-px border-b-2 transition-colors text-sm",
              {
                "border-blue-200 text-black font-medium": selected === tab,
                "border-transparent text-gray-500 hover:text-black":
                  selected !== tab,
              }
            )}
          >
            {tab}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Tabs;

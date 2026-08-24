import { Link, useLocation } from "react-router-dom";
import cx from "classnames";
import * as React from "react";
import { Ruler, Square, Scissors, Download } from "lucide-react";

const NavBar = () => {
  const tabs = [
    {
      name: "Ruler",
      icon: <Ruler size={20} />,
    },
    {
      name: "Spacer",
      icon: <Square size={20} />,
    },
    {
      name: "Cuts",
      icon: <Scissors size={20} />,
    },
    {
      name: "Export",
      icon: <Download size={20} />,
    },
  ];

  const location = useLocation();
  const currentPath = location.pathname.slice(1) || "library";

  const isSelected = (tab) => currentPath === tab.name.toLowerCase();
  return (
    <div className="w-full absolute bottom-0 left-0 bg-white">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <Link
            className="w-full"
            to={`/${tab.name.toLowerCase()}`}
            key={tab.name}
          >
            <div
              role="button"
              className={cx(
                "flex flex-col items-center py-4 justify-center text-xs bg-surface cursor-pointer",
                {
                  "border-t-2 border-blue-100 fill-blue-100 bg-gray-50":
                    isSelected(tab),
                  "border-t-2 border-gray-100 fill-gray-100 ": !isSelected(tab),
                }
              )}
            >
              <div
                className={cx({
                  "text-black": isSelected(tab),
                  "text-gray-50": !isSelected(tab),
                })}
              />

              <div className="h-5 w-5">{tab.icon}</div>

              <p>{tab.name}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="border-b border-gray-300" />
    </div>
  );
};

export default NavBar;

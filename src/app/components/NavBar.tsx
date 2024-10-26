import { Link, useLocation } from "react-router-dom";
import cx from "classnames";
import * as React from "react";

const NavBar = () => {
  const tabs = [
    {
      name: "Converter",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6"
        >
          <path
            fill-rule="evenodd"
            d="M12 2.25a.75.75 0 0 1 .75.75v.756a49.106 49.106 0 0 1 9.152 1 .75.75 0 0 1-.152 1.485h-1.918l2.474 10.124a.75.75 0 0 1-.375.84A6.723 6.723 0 0 1 18.75 18a6.723 6.723 0 0 1-3.181-.795.75.75 0 0 1-.375-.84l2.474-10.124H12.75v13.28c1.293.076 2.534.343 3.697.776a.75.75 0 0 1-.262 1.453h-8.37a.75.75 0 0 1-.262-1.453c1.162-.433 2.404-.7 3.697-.775V6.24H6.332l2.474 10.124a.75.75 0 0 1-.375.84A6.723 6.723 0 0 1 5.25 18a6.723 6.723 0 0 1-3.181-.795.75.75 0 0 1-.375-.84L4.168 6.241H2.25a.75.75 0 0 1-.152-1.485 49.105 49.105 0 0 1 9.152-1V3a.75.75 0 0 1 .75-.75Zm4.878 13.543 1.872-7.662 1.872 7.662h-3.744Zm-9.756 0L5.25 8.131l-1.872 7.662h3.744Z"
            clip-rule="evenodd"
          />
        </svg>
      ),
    },
    {
        name: "Cuts",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5"
          >
            <path
              fill-rule="evenodd"
              d="M1.469 3.75a3.5 3.5 0 0 0 5.617 4.11l.883.51c.025.092.147.116.21.043.15-.176.318-.338.5-.484.286-.23.3-.709-.018-.892l-.825-.477A3.501 3.501 0 0 0 1.47 3.75Zm2.03 3.482a2 2 0 1 1 2-3.464 2 2 0 0 1-2 3.464ZM9.956 8.322a2.75 2.75 0 0 0-1.588 1.822L7.97 11.63l-.884.51A3.501 3.501 0 0 0 1.47 16.25a3.5 3.5 0 0 0 6.367-2.81l10.68-6.166a.75.75 0 0 0-.182-1.373l-.703-.189a2.75 2.75 0 0 0-1.78.123L9.955 8.322ZM2.768 15.5a2 2 0 1 1 3.464-2 2 2 0 0 1-3.464 2Z"
              clip-rule="evenodd"
            />
            <path d="M12.52 11.89a.5.5 0 0 0 .056.894l3.274 1.381a2.75 2.75 0 0 0 1.78.123l.704-.189a.75.75 0 0 0 .18-1.373l-3.47-2.004a.5.5 0 0 0-.5 0L12.52 11.89Z" />
          </svg>
        ),
      },
    {
      name: "Spacer",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6"
        >
          <path
            fill-rule="evenodd"
            d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
            clip-rule="evenodd"
          />
        </svg>
      ),
    }
  ];

  const location = useLocation();
  const currentPath = location.pathname.slice(1) || "library";

  const isSelected = (tab) => currentPath === tab.name.toLowerCase();
  return (
    <div className="w-full absolute bottom-0 left-0 ">
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

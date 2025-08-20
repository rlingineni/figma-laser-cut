import { Link, useLocation } from "react-router-dom";
import cx from "classnames";
import * as React from "react";

const NavBar = () => {
  const tabs = [
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
    },
    {
      name: "Ruler",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="size-6 -mt-1"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_54_13)">
            <path
              d="M23.8597 4.64338L19.3562 0.139777C19.1694 -0.0469258 18.8668 -0.0469258 18.68 0.139777L0.139783 18.68C-0.0469198 18.8667 -0.0469198 19.1694 0.139783 19.3561L4.64334 23.8597C4.73666 23.9531 4.85905 23.9998 4.9814 23.9998C5.10374 23.9998 5.22613 23.9531 5.31946 23.8597L23.8597 5.3195C23.9493 5.22988 23.9997 5.10828 23.9997 4.98144C23.9998 4.8546 23.9494 4.733 23.8597 4.64338ZM4.9814 22.8455L1.15392 19.018L3.12173 17.0502L3.83554 17.7641C3.92892 17.8575 4.05126 17.9041 4.1736 17.9041C4.29595 17.9041 4.41834 17.8574 4.51166 17.7641C4.69837 17.5774 4.69841 17.2747 4.51166 17.088L3.79781 16.3741L5.76557 14.4063L7.10403 15.7448C7.19741 15.8382 7.31975 15.8848 7.4421 15.8848C7.56444 15.8848 7.68683 15.8382 7.78016 15.7448C7.96686 15.5581 7.96686 15.2554 7.78016 15.0686L6.44169 13.7302L8.40945 11.7624L9.12331 12.4763C9.21669 12.5697 9.33903 12.6163 9.46137 12.6163C9.58372 12.6163 9.70611 12.5697 9.79944 12.4763C9.98614 12.2896 9.98614 11.9869 9.79944 11.8001L9.08558 11.0863L11.0533 9.11852L12.8192 10.8843C12.9125 10.9777 13.0349 11.0244 13.1572 11.0244C13.2796 11.0244 13.4019 10.9777 13.4953 10.8843C13.682 10.6976 13.682 10.3949 13.4953 10.2082L11.7295 8.44235L13.6973 6.47455L14.4111 7.1884C14.5045 7.28178 14.6268 7.32842 14.7491 7.32842C14.8715 7.32842 14.9938 7.28173 15.0872 7.1884C15.2739 7.0017 15.2739 6.69898 15.0872 6.51228L14.3733 5.79842L16.3412 3.83061L18.1069 5.59644C18.2003 5.68981 18.3227 5.73645 18.445 5.73645C18.5673 5.73645 18.6897 5.68977 18.7831 5.59644C18.9698 5.40974 18.9698 5.10702 18.7831 4.92031L17.0172 3.15449L19.0181 1.15387L22.8456 4.98135L4.9814 22.8455Z"
              fill="black"
            />
            <path
              d="M8.9967 16.2852L8.8324 16.1209C8.6457 15.9342 8.34298 15.9342 8.15623 16.1209C7.96953 16.3076 7.96953 16.6103 8.15623 16.7971L8.32062 16.9614C8.414 17.0548 8.53634 17.1014 8.65868 17.1014C8.78103 17.1014 8.90342 17.0548 8.99675 16.9614C9.1834 16.7747 9.1834 16.472 8.9967 16.2852Z"
              fill="black"
            />
          </g>
          <defs>
            <clipPath id="clip0_54_13">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
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

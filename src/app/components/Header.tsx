import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const PageHeader = ({
  backLink,
  title,
  rightOptions,
  onBackClick,
}: {
  title: string;
  backLink?: string;
  rightOptions?: React.ReactElement;
  onBackClick?: () => void;
}) => {
  return (
    <div className="w-full shadow-md p-3">
      <div className="flex justify-between">
        <span className="flex items-center">
          {backLink && (
            <Link
              to={backLink}
              className="mr-2 cursor-pointer"
              onClick={() => {
                if (onBackClick) {
                  onBackClick();
                }
              }}
            >
              <ChevronLeft size={16} color="#111111" />
            </Link>
          )}
          <p className="font-semibold text-sm">{title}</p>
        </span>
        {rightOptions}
      </div>
    </div>
  );
};

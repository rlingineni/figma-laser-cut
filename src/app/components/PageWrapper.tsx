import * as React from "react";
import * as cx from "classnames";
import { Link } from "react-router-dom";
import useNavigationStore from "../store/navigation";
import NavBar from "./NavBar";

const PageWrapper = ({ children }) => {
  const setCurrentPage = useNavigationStore((st) => st.setCurrentPage);
  const { currentPage } = useNavigationStore();

  return (
    <div>
      <div className="h-full">{children}</div>

      <NavBar />
    </div>
  );
};

export default PageWrapper;

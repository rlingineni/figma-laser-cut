import * as React from "react";
import { Navigate, RouterProvider, createMemoryRouter } from "react-router-dom";
import PageWrapper from "./components/PageWrapper";
import Cuts from "./pages/Cuts";
import Spacer from "./pages/Spacer";
import Converter from "./pages/Ruler";

function App() {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <Navigate to="/spacer" />,
    },
    {
      path: "/spacer",
      element: (
        <PageWrapper>
          <Spacer />
        </PageWrapper>
      ),
    },
    {
      path: "/cuts",
      element: (
        <PageWrapper>
          <Cuts />
        </PageWrapper>
      ),
    },
    {
      path: "/ruler",
      element: (
        <PageWrapper>
          <Converter />
        </PageWrapper>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;

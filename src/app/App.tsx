import * as React from "react";
import { Navigate, RouterProvider, createMemoryRouter } from "react-router-dom";
import PageWrapper from "./components/PageWrapper";
import Cuts from "./pages/Page2";
import Spacer from "./pages/Page1";
import Converter from "./pages/Page3";

function App() {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <Navigate to="/converter" />,
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
      path: "/converter",
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

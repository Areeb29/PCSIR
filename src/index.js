import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import AuthenticationLogin from "./pages/AuthenticationLogin";
import AuthenticationSignup from "./pages/AuthenticationSignup";
import ContentDoctor from "./pages/ContentDoctor";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthenticationSignup/>,
  },
  {
    path: "login",
    element: <AuthenticationLogin/>,
  },
  {
    path: "doctor/:designation",
    element: <ContentDoctor/>,
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
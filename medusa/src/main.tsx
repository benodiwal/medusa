import React from "react";
import ReactDOM from "react-dom/client";
import Loading from "./pages/Loading";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Loading />
  </React.StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import Loading from "./pages/Loading";
import "./index.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import App from "./pages/App";
import Agent from "./pages/Agent";
import { Layout } from "./components/Layout";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Loading />} />
        <Route path="/app" element={
          <Layout>
            <App />
          </Layout>
        } />
        <Route path="/agent" element={
          <Layout>
            <Agent />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

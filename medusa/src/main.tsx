import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import KanbanBoard from "./pages/KanbanBoard";
import Settings from "./pages/Settings";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<KanbanBoard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

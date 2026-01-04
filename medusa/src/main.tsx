import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthorProvider } from "./contexts/AuthorContext";
import KanbanBoard from "./pages/KanbanBoard";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Share from "./pages/Share";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthorProvider>
          <Routes>
            <Route path="/" element={<KanbanBoard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/share" element={<Share />} />
          </Routes>
        </AuthorProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

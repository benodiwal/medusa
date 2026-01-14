import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FontProvider } from "./contexts/FontContext";
import { AuthorProvider } from "./contexts/AuthorContext";
import KanbanBoard from "./pages/KanbanBoard";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Share from "./pages/Share";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FontProvider>
          <AuthorProvider>
            <Routes>
            <Route path="/" element={<KanbanBoard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/share" element={<Share />} />
            </Routes>
          </AuthorProvider>
        </FontProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

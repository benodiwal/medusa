import { Routes, Route } from "react-router-dom";
import { useSetup } from "./contexts/SetupContext";
import { SetupScreen, SetupBanner } from "./components/setup";
import UnifiedKanban from "./pages/UnifiedKanban";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Share from "./pages/Share";
import TaskDetail from "./pages/TaskDetail";

function AppContent() {
  const { isLoading } = useSetup();

  if (isLoading) {
    return <SetupScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SetupBanner />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<UnifiedKanban />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<History />} />
          <Route path="/share" element={<Share />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}

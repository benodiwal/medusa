import { ChatInterface } from "@/components/ChatInterface";
import { WorkspaceSetup } from "@/components/WorkspaceSetup";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const App = () => {
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="flex h-screen bg-background w-full">
      {activeWorkspace ? <ChatInterface /> : <WorkspaceSetup />}
    </div>
  );
};

export default App;

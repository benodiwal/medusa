import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { RightSidebar } from "@/components/RightSidebar";
import { AgentHeader } from "@/components/AgentHeader";

const Agent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex flex-col h-screen bg-background w-full">
      <AgentHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <ChatInterface />
        {sidebarOpen && <RightSidebar />}
      </div>
    </div>
  );
};

export default Agent;
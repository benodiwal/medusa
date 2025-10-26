import { ChatInterface } from "@/components/ChatInterface";
import { RightSidebar } from "@/components/RightSidebar";

const Agent = () => {
  return (
    <div className="flex h-screen bg-background w-full">
      <ChatInterface />
      <RightSidebar />
    </div>
  );
};

export default Agent;
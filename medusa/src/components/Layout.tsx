import { ReactNode } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <ChatSidebar />
      {children}
    </div>
  );
};
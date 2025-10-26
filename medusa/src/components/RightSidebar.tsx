import React, { useState, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, GitBranch, FileText, Terminal } from "lucide-react";

export const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState("plan");
  const [width, setWidth] = useState(320); // 80 * 4 = 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 240; // Minimum width
    const maxWidth = 600; // Maximum width

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Attach global mouse events when resizing
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={sidebarRef}
      className="bg-card border-l border-border h-full flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary/50" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted rounded-none border-b border-border">
          <TabsTrigger
            value="plan"
            className="flex items-center justify-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <CheckSquare className="w-3 h-3" />
            {width > 280 && "Plan"}
          </TabsTrigger>
          <TabsTrigger
            value="changes"
            className="flex items-center justify-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <GitBranch className="w-3 h-3" />
            {width > 280 && "Changes"}
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="flex items-center justify-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <FileText className="w-3 h-3" />
            {width > 280 && "Logs"}
          </TabsTrigger>
          <TabsTrigger
            value="terminal"
            className="flex items-center justify-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <Terminal className="w-3 h-3" />
            {width > 280 && "Terminal"}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="plan" className="h-full m-0 p-4">
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No plan yet</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="changes" className="h-full m-0 p-4">
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No changes yet</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="h-full m-0 p-4">
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs yet</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terminal" className="h-full m-0 p-4">
            <div className="h-full bg-black rounded-md p-4 font-mono text-sm">
              <div className="text-green-400">
                <span className="text-blue-400">user@medusa</span>
                <span className="text-white">:</span>
                <span className="text-purple-400">~</span>
                <span className="text-white">$ </span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
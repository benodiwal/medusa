import React, { useState, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, GitBranch, FileText, Terminal, Clock, AlertCircle, Info, CheckCircle } from "lucide-react";

export const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState("plan");
  const [width, setWidth] = useState(320); // 80 * 4 = 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState([
    { type: "command", text: "npm run dev" },
    { type: "output", text: "Starting development server..." },
    { type: "output", text: "Local:   http://localhost:3000" },
    { type: "output", text: "Ready in 1.2s" },
  ]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

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

  const handleTerminalCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      const newHistory = [
        ...terminalHistory,
        { type: "command", text: terminalInput },
      ];

      // Simulate command responses
      if (terminalInput.includes('ls')) {
        newHistory.push({ type: "output", text: "src/  package.json  README.md  node_modules/" });
      } else if (terminalInput.includes('git status')) {
        newHistory.push({ type: "output", text: "On branch main\nYour branch is up to date with 'origin/main'." });
      } else if (terminalInput.includes('npm')) {
        newHistory.push({ type: "output", text: "Command executed successfully" });
      } else {
        newHistory.push({ type: "output", text: `Command '${terminalInput}' executed` });
      }

      setTerminalHistory(newHistory);
      setTerminalInput("");
    }
  };

  const handleTerminalClick = () => {
    if (terminalInputRef.current) {
      terminalInputRef.current.focus();
    }
  };

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
            className="cursor-pointer flex items-center justify-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <CheckSquare className="w-3 h-3" />
            {width > 280 && "Plan"}
          </TabsTrigger>
          <TabsTrigger
            value="changes"
            className="cursor-pointer flex items-center justify-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <GitBranch className="w-3 h-3" />
            {width > 280 && "Changes"}
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="cursor-pointer flex items-center justify-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <FileText className="w-3 h-3" />
            {width > 280 && "Logs"}
          </TabsTrigger>
          <TabsTrigger
            value="terminal"
            className="cursor-pointer flex items-center justify-center gap-1 text-xs data-[state=active]:bg-background"
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
            <div className="h-full overflow-y-auto font-mono text-xs leading-relaxed">
              <div className="space-y-0.5">
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:26:27.465</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">creating image</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.971</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#0 building with "desktop-linux"</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.971</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">|</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.971</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#1 [internal] load build definition</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.971</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#1 transferring dockerfile: 6.6kb</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#1 DONE 0.0s</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">|</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#2 [context imbue_user_repo] load .dockerignore</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#2 transferring imbue_user_repo: 2B done</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#2 DONE 0.0s</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">|</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#3 [context ssh_keypair_dir] load</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#3 transferring ssh_keypair_dir: 32B done</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#3 DONE 0.0s</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">|</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.972</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#4 [internal] load metadata for</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.973</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#4 DONE 0.0s</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.973</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">|</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.973</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#5 [internal] load .dockerignore</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.973</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#5 transferring context: 2B done</span>
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">20:27:51.973</span>
                  <span className="text-muted-foreground ml-2">[DEBUG]</span>
                  <span className="ml-2">#5 DONE 0.0s</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terminal" className="h-full m-0 p-4">
            <div
              className="h-full bg-black rounded-md p-4 font-mono text-sm overflow-y-auto cursor-text"
              onClick={handleTerminalClick}
            >
              {/* Terminal history */}
              <div className="space-y-1">
                {terminalHistory.map((entry, index) => (
                  <div key={index}>
                    {entry.type === "command" ? (
                      <div className="text-green-400">
                        <span className="text-blue-400">user@medusa</span>
                        <span className="text-white">:</span>
                        <span className="text-purple-400">~</span>
                        <span className="text-white">$ </span>
                        <span className="text-white">{entry.text}</span>
                      </div>
                    ) : (
                      <div className="text-gray-300 whitespace-pre-line ml-4">
                        {entry.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Current input line */}
              <div className="text-green-400 flex">
                <span className="text-blue-400">user@medusa</span>
                <span className="text-white">:</span>
                <span className="text-purple-400">~</span>
                <span className="text-white">$ </span>
                <input
                  ref={terminalInputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalCommand}
                  className="bg-transparent border-none outline-none text-white flex-1 font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="animate-pulse text-white">_</span>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
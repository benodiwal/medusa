import React, { useState, useRef, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, GitBranch, FileText, Terminal } from "lucide-react";
import { AgentService } from "@/lib/services/agentService";
import { useAgent } from "@/contexts/AgentContext";

export const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState("plan");
  const [width, setWidth] = useState(320); // 80 * 4 = 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState([
    { type: "output", text: "Welcome to Medusa Agent Terminal" },
    { type: "output", text: "Commands are executed in the agent's container environment." },
    { type: "output", text: "Type commands and press Enter to execute." },
  ]);
  const [containerLogs, setContainerLogs] = useState<string[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { agents, selectedAgentId } = useAgent();

  // Get the current agent based on selectedAgentId or fallback to most recent
  const getCurrentAgent = useCallback(() => {
    if (!agents || agents.length === 0) return null;

    if (selectedAgentId) {
      const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
      if (selectedAgent) return selectedAgent;
    }

    // Fallback to most recent active agent
    const activeAgents = agents.filter(agent => agent.status.toLowerCase() !== 'archived');
    return activeAgents.length > 0 ? activeAgents[activeAgents.length - 1] : null;
  }, [agents, selectedAgentId]);

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

  const handleTerminalCommand = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      const command = terminalInput.trim();
      const newHistory = [
        ...terminalHistory,
        { type: "command", text: command },
      ];

      // Clear input immediately
      setTerminalInput("");

      // Show command in history
      setTerminalHistory(newHistory);

      // Execute real command if we have an active agent
      const currentAgent = getCurrentAgent();
      if (currentAgent && currentAgent.status !== 'Archived') {
          try {
            // Show loading indicator
            const loadingHistory = [...newHistory, { type: "output", text: "Executing..." }];
            setTerminalHistory(loadingHistory);

            // Execute command in container
            const output = await AgentService.executeTerminalCommand(currentAgent.id, command);

            // Update with actual output
            const finalHistory = [
              ...newHistory,
              { type: "output", text: output || "(no output)" }
            ];
            setTerminalHistory(finalHistory);
          } catch (error) {
            console.error('Failed to execute terminal command:', error);
            const errorHistory = [
              ...newHistory,
              { type: "output", text: `Error: ${error instanceof Error ? error.message : 'Command failed'}` }
            ];
            setTerminalHistory(errorHistory);
          }
        } else {
          // No active agent
          const errorHistory = [
            ...newHistory,
            { type: "output", text: "Error: No active agent available" }
          ];
          setTerminalHistory(errorHistory);
        }
    }
  };

  const handleTerminalClick = () => {
    if (terminalInputRef.current) {
      terminalInputRef.current.focus();
    }
  };

  // Fetch container logs for the current agent
  useEffect(() => {
    const fetchLogs = async () => {
      const currentAgent = getCurrentAgent();
      if (currentAgent && currentAgent.status !== 'Archived') {
        setIsLoadingLogs(true);
        try {
          const logs = await AgentService.getAgentLogs(currentAgent.id);
          // Parse and format the logs
          const logLines = logs.split('\n').filter(line => line.trim());
          setContainerLogs(logLines);
        } catch (error) {
          console.error('Failed to fetch agent logs:', error);
          setContainerLogs(['Failed to load container logs']);
        } finally {
          setIsLoadingLogs(false);
        }
      } else {
        // Clear logs if no current agent
        setContainerLogs([]);
        setIsLoadingLogs(false);
      }
    };

    // Initial fetch
    fetchLogs();

    // Set up polling interval for live logs
    const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [getCurrentAgent]);

  // Clear terminal history when agent changes
  useEffect(() => {
    setTerminalHistory([
      { type: "output", text: "Welcome to Medusa Agent Terminal" },
      { type: "output", text: "Commands are executed in the agent's container environment." },
      { type: "output", text: "Type commands and press Enter to execute." },
    ]);
  }, [selectedAgentId]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current && activeTab === 'logs') {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [containerLogs, activeTab]);

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
              {isLoadingLogs ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p>Loading container logs...</p>
                  </div>
                </div>
              ) : containerLogs.length > 0 ? (
                <div className="space-y-0.5">
                  {containerLogs.map((log, index) => {
                    // Skip empty lines
                    if (!log.trim()) return null;

                    // Check for header lines (=== ... ===)
                    if (log.startsWith('===') && log.endsWith('===')) {
                      return (
                        <div key={index} className="text-primary font-bold mt-2 mb-1">
                          {log.replace(/===/g, '').trim()}
                        </div>
                      );
                    }

                    // Parse Docker timestamp format (RFC3339) or custom timestamp format
                    const dockerTimestampMatch = log.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z?)/);
                    const customTimestampMatch = log.match(/^\[(\d{2}:\d{2}:\d{2}\.\d{3})\]/);
                    const simpleTimestampMatch = log.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})/);

                    let timestamp = '';
                    let restOfLog = log;

                    if (dockerTimestampMatch) {
                      // Convert Docker timestamp to readable format
                      const date = new Date(dockerTimestampMatch[1]);
                      const hours = date.getHours().toString().padStart(2, '0');
                      const minutes = date.getMinutes().toString().padStart(2, '0');
                      const seconds = date.getSeconds().toString().padStart(2, '0');
                      const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
                      timestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;
                      restOfLog = log.substring(dockerTimestampMatch[0].length).trim();
                    } else if (customTimestampMatch) {
                      timestamp = customTimestampMatch[1];
                      restOfLog = log.substring(customTimestampMatch[0].length).trim();
                    } else if (simpleTimestampMatch) {
                      timestamp = simpleTimestampMatch[1];
                      restOfLog = log.substring(simpleTimestampMatch[0].length).trim();
                    }

                    // Check for log levels
                    const levelMatch = restOfLog.match(/^\[(DEBUG|INFO|WARN|ERROR|TRACE)\]/i);
                    let level = '';
                    let message = restOfLog;

                    if (levelMatch) {
                      level = levelMatch[1].toUpperCase();
                      message = restOfLog.substring(levelMatch[0].length).trim();
                    }

                    return (
                      <div key={index} className="font-mono text-foreground">
                        {timestamp && (
                          <span className="text-muted-foreground text-xs">[{timestamp}]</span>
                        )}
                        {level && (
                          <span className={`ml-2 text-xs font-semibold ${
                            level === 'ERROR' ? 'text-red-500' :
                            level === 'WARN' ? 'text-yellow-500' :
                            level === 'INFO' ? 'text-blue-500' :
                            level === 'DEBUG' ? 'text-gray-500' :
                            'text-muted-foreground'
                          }`}>
                            [{level}]
                          </span>
                        )}
                        <span className="ml-2">{message || restOfLog}</span>
                      </div>
                    );
                  }).filter(Boolean)}
                  <div ref={logsEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No container logs available</p>
                  </div>
                </div>
              )}
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
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAgent } from "@/contexts/AgentContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Image,
  Paperclip,
  Bot,
  ChevronDown,
  Check,
  ArrowRight,
} from "lucide-react";

export const ChatInterface = () => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("sonnet");
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'assistant', text: string}>>([]);
  const { activeWorkspace } = useWorkspace();
  const { createAgent, isLoading: isCreatingAgent, agents, selectedAgentId } = useAgent();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on the agent page
  const isAgentPage = location.pathname === '/agent';

  // Get current agent if on agent page
  const getCurrentAgent = () => {
    if (!isAgentPage || !agents || agents.length === 0) return null;

    if (selectedAgentId) {
      return agents.find(agent => agent.id === selectedAgentId) || null;
    }

    // Fallback to most recent active agent
    const activeAgents = agents.filter(agent => agent.status.toLowerCase() !== 'archived');
    return activeAgents.length > 0 ? activeAgents[activeAgents.length - 1] : null;
  };

  const currentAgent = getCurrentAgent();

  const handleSubmit = async () => {
    if (!message.trim()) return;

    if (isAgentPage) {
      // On agent page - send message to existing agent
      if (!currentAgent) {
        console.error('No active agent to send message to');
        return;
      }

      // Add message to chat history for now
      // TODO: In the future, this should send the message to the agent via API
      setChatHistory(prev => [
        ...prev,
        { type: 'user', text: message.trim() },
        { type: 'assistant', text: 'Agent interaction coming soon. This agent is currently running autonomously.' }
      ]);
      setMessage("");

      console.log(`Would send message to agent ${currentAgent.id}: ${message.trim()}`);
    } else {
      // On home page - create new agent
      try {
        await createAgent(message.trim(), selectedModel);
        setMessage("");
        navigate('/agent');
      } catch (error) {
        console.error('Failed to create agent:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isAgentPage) {
    // Check if agent is archived
    const isArchived = currentAgent?.status?.toLowerCase() === 'archived';

    // Agent page layout - chat at bottom
    return (
      <TooltipProvider>
        <div className="flex-1 flex flex-col h-full bg-background">
          {/* Chat History Area */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            {/* Title Section */}
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-2xl font-semibold text-foreground">
                {currentAgent ? `Agent: ${currentAgent.name}` : "No Agent"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentAgent ? `Task: ${currentAgent.task}` : "No agent selected"}
              </p>
              {isArchived && (
                <p className="text-sm text-amber-600 dark:text-amber-500 font-medium">
                  This agent has been archived
                </p>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatHistory.length > 0 ? (
                chatHistory.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl p-3 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Start a conversation with the agent</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Fixed at bottom (hide for archived agents) */}
          {!isArchived && (
            <div className="border-t border-border bg-card p-4">
              <div className="w-full max-w-3xl mx-auto">
                <div className="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message to the agent (Coming soon)..."
                    className="min-h-[80px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                    disabled={isCreatingAgent || !currentAgent}
                  />

                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background">
                    <div className="flex items-center gap-2">
                      <TooltipButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                        tooltip="Attach files"
                        tooltipSide="top"
                      >
                        <Paperclip className="w-4 h-4" />
                      </TooltipButton>
                      <TooltipButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                        tooltip="Attach images"
                        tooltipSide="top"
                      >
                        <Image className="w-4 h-4" />
                      </TooltipButton>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!message.trim() || isCreatingAgent || !currentAgent}
                      title="Send message to agent"
                      className="cursor-pointer h-8 w-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Home page layout - centered
  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col h-full bg-background">
      {/* Main Content */}
      <main className="relative flex-1 flex items-center justify-center p-6 bg-background overflow-hidden">
        <div className="relative z-10 w-full max-w-3xl space-y-6">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {activeWorkspace?.name || "No workspace"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeWorkspace?.repo_path || "No repository selected"}
            </p>
          </div>

          {/* Input Area */}
          <div className="relative">
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your task..."
                className="min-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                disabled={isCreatingAgent}
              />

              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <TooltipButton
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                    tooltip="Attach files"
                    tooltipSide="top"
                  >
                    <Paperclip className="w-4 h-4" />
                  </TooltipButton>
                  <TooltipButton
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                    tooltip="Attach images"
                    tooltipSide="top"
                  >
                    <Image className="w-4 h-4" />
                  </TooltipButton>
                </div>

                <div className="flex items-center gap-2">
                  {/* Model Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors">
                        <Bot className="w-4 h-4" />
                        <span>{selectedModel === "opus" ? "Opus" : selectedModel === "haiku" ? "Haiku" : "Sonnet"}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="top"
                      className="w-56 bg-card border-border"
                    >
                        <DropdownMenuItem
                        onClick={() => setSelectedModel("opus")}
                        className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                        {selectedModel === "opus" ? <Check className="w-4 h-4 mr-2" /> : <span className="w-4 h-4 mr-2"></span>}
                        Claude 4.1 Opus
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedModel("sonnet")}
                        className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                        {selectedModel === "sonnet" ? <Check className="w-4 h-4 mr-2" /> : <span className="w-4 h-4 mr-2"></span>}
                        Claude 4.5 Sonnet
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedModel("haiku")}
                        className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                        {selectedModel === "haiku" ? <Check className="w-4 h-4 mr-2" /> : <span className="w-4 h-4 mr-2"></span>}
                        Claude 4.5 Haiku
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || isCreatingAgent}
                    title="Create new agent"
                    className="cursor-pointer h-8 w-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </TooltipProvider>
  );
};
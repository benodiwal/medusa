import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAgent } from "@/contexts/AgentContext";
import { useNavigate } from "react-router-dom";
import {
  Image,
  Paperclip,
  Code,
  Bot,
  ChevronDown,
  Check,
  ArrowRight,
} from "lucide-react";

export const ChatInterface = () => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("sonnet");
  const { activeWorkspace } = useWorkspace();
  const { createAgent, isLoading: isCreatingAgent, error: agentError } = useAgent();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      const agentId = await createAgent(message.trim(), selectedModel);
      setMessage("");
      navigate('/agent');
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col h-screen bg-background">
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
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAgent } from "@/contexts/AgentContext";
import { useNavigate } from "react-router-dom";
import {
  Image,
  Paperclip,
  Bot,
  ChevronDown,
  Check,
  ArrowRight,
} from "lucide-react";

interface CreateNewAgentModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreateNewAgentModal = ({ children, open, onOpenChange }: CreateNewAgentModalProps) => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("sonnet");
  const { createAgent, isLoading: isCreatingAgent, error: _agentError } = useAgent();
  const navigate = useNavigate();

  const modelOptions = [
    { value: "sonnet", label: "Claude 4.5 Sonnet" },
    { value: "opus", label: "Claude 4.1 Opus" },
    { value: "haiku", label: "Claude 4.5 Haiku" },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      await createAgent(message.trim(), selectedModel);
      setMessage("");
      onOpenChange?.(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-6 bg-background">
        <TooltipProvider>
          <div className="space-y-6">
            {/* Header */}
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-semibold text-foreground">
                Create New Agent
              </DialogTitle>
              <p className="text-center text-sm text-muted-foreground">
                Describe what you want your agent to help you with
              </p>
            </DialogHeader>

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
                              <span>{modelOptions.find(m => m.value === selectedModel)?.label}</span>
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-card border-border">
                            {modelOptions.map((model) => (
                              <DropdownMenuItem
                                key={model.value}
                                onClick={() => setSelectedModel(model.value)}
                                className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
                              >
                                {selectedModel === model.value ? (
                                  <Check className="w-4 h-4 mr-2" />
                                ) : (
                                  <span className="w-4 h-4 mr-2"></span>
                                )}
                                {model.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                          onClick={handleSubmit}
                          disabled={!message.trim() || isCreatingAgent}
                          className="cursor-pointer h-8 w-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};
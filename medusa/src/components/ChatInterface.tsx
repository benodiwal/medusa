import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Main Content */}
      <main className="relative flex-1 flex items-center justify-center p-6 bg-background overflow-hidden">
        <div className="relative z-10 w-full max-w-3xl space-y-6">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              churnguard
            </h1>
            <p className="text-sm text-muted-foreground">
              /users/sachielagentv1/churnguard
            </p>
          </div>

          {/* Input Area */}
          <div className="relative">
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your task..."
                className="min-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
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
                        <span>Sonnet</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="top"
                      className="w-56 bg-card border-border"
                    >
                      <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-muted focus:bg-muted">
                        <span className="w-4 h-4 mr-2"></span>
                        Claude 4.1 Opus
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-muted focus:bg-muted">
                        <Check className="w-4 h-4 mr-2" />
                        Claude 4.5 Sonnet
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-muted focus:bg-muted">
                        <span className="w-4 h-4 mr-2"></span>
                        Claude 4.5 Haiku
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button className="cursor-pointer h-8 w-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center">
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
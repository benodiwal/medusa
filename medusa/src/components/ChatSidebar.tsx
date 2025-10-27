import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { ArchiveIcon, Check, ChevronDown, HelpCircle, Home, Plus, Search, Settings, Sidebar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConversationItem } from "./ConversationItem";

export const ChatSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <aside
        className={`relative h-screen transition-all duration-300 ${
          isCollapsed
            ? "w-16 bg-background"
            : "w-78 bg-card border-r border-border"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-2">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <motion.img
                    src="/medusa-logo.png"
                    alt="Medusa Logo"
                    className="w-12 h-12 object-contain relative z-10"
                    initial={{ filter: "brightness(0.8)" }}
                    animate={{
                      filter: "brightness(1)",
                      transition: { duration: 1 }
                    }}
                  />

                  {/* Glowing effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: [0, 0.8, 0.6],
                      scale: [0.5, 1.2, 1],
                      transition: {
                        duration: 2,
                        delay: 0.2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }
                    }}
                  />

                  {/* Floating particles effect */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-amber-400 rounded-full opacity-60"
                      initial={{
                        x: 0,
                        y: 0,
                        scale: 0
                      }}
                      animate={{
                        x: [0, Math.cos(i * 60 * Math.PI / 180) * 25, Math.cos(i * 60 * Math.PI / 180) * 35],
                        y: [0, Math.sin(i * 60 * Math.PI / 180) * 25, Math.sin(i * 60 * Math.PI / 180) * 35],
                        scale: [0, 1, 0],
                        opacity: [0, 0.8, 0],
                        transition: {
                          duration: 2.5,
                          delay: 0.5 + i * 0.1,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeOut"
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center">
                {
                  !isCollapsed && (
                  <TooltipButton
                  variant="ghost"
                  size="icon"
                  onClick={() => {}}
                  className="text-muted-foreground hover:bg-secondary"
                  tooltip={"Search for agents ⌘ K"}
                  tooltipSide="bottom"
                  >
                    <Search className="w-4 h-4"/>
                    </TooltipButton>
                  )   
                }
                {
                    !isCollapsed && (
                    <TooltipButton
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/app')}
                    className="text-muted-foreground hover:bg-secondary"
                    tooltip={"Go to home"}
                    tooltipSide="bottom"
                    >
                        <Home className="w-4 h-4"/>
                    </TooltipButton>
                    )
                }
            <TooltipButton
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-muted-foreground hover:bg-secondary"
              tooltip={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              tooltipSide="right"
            >
                <Sidebar className="w-4 h-4"/>
            </TooltipButton>
            </div>
          </div>

        {/* New Chat Button */}
        {!isCollapsed && (
          <div className="p-1">
            <Button className="w-full bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-foreground border border-sidebar-border">
            <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Plus className="mr-[10px]"/>
              New Agent
              </div>
              <div>⌘ N</div>
            </div>
            </Button>
          </div>
        )}

        {/* Conversations */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {!isCollapsed && (
              <div className="space-y-1">
                <ConversationItem
                  title="Hi"
                  subtitle="21 hrs ago • sculptor/vengefu..."
                  isActive={true}
                  onClick={() => navigate('/agent')}
                  onPairMode={() => console.log('Start pairing mode')}
                  onCopyBranch={() => console.log('Copy branch name')}
                  onArchive={() => console.log('Archive conversation')}
                  onDelete={() => console.log('Delete conversation')}
                />

                <ConversationItem
                  title="Hi"
                  subtitle="21 hrs ago • sculptor/vengefu..."
                  isActive={false}
                  onClick={() => navigate('/agent')}
                  onPairMode={() => console.log('Start pairing mode')}
                  onCopyBranch={() => console.log('Copy branch name')}
                  onArchive={() => console.log('Archive conversation')}
                  onDelete={() => console.log('Delete conversation')}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-2">
          {!isCollapsed && (
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                <TooltipButton
                  variant="ghost"
                  size="icon"
                  onClick={() => {}}
                  className="text-muted-foreground hover:bg-secondary"
                  tooltip={"Show Archive Agents"}
                  tooltipSide="top"
                  >
                    <ArchiveIcon className="w-4 h-4"/>
                </TooltipButton>
                <div className="flex items-center">
                    <TooltipButton
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/settings")}
                  className="text-muted-foreground hover:bg-secondary"
                  tooltip={"Settings"}
                  tooltipSide="top"
                  >
                    <Settings className="w-4 h-4"/>
                    </TooltipButton>
                    <TooltipButton
                  variant="ghost"
                  size="icon"
                  onClick={() => {}}
                  className="text-muted-foreground hover:bg-secondary"
                  tooltip={"Help"}
                  tooltipSide="top"
                  >
                    <HelpCircle className="w-4 h-4"/>
                    </TooltipButton>
                </div>
                </div>

                {/* Workspace Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm text-sidebar-foreground bg-sidebar-background border border-sidebar-border rounded-md hover:opacity-90 transition-colors">
                      <span>churnguard</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    className="w-73 bg-sidebar-background border-sidebar-border"
                  >
                    <DropdownMenuItem className="cursor-pointer text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground focus:bg-white/10 focus:text-sidebar-foreground">
                      <Check className="w-4 h-4 mr-2" />
                      churnguard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-sidebar-border" />
                    <DropdownMenuItem className="cursor-pointer text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground focus:bg-white/10 focus:text-sidebar-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Open New Repo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </aside>
    </TooltipProvider>
  );
};
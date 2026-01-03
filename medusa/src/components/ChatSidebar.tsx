import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { ArchiveIcon, Check, ChevronDown, HelpCircle, Home, Plus, Search, Settings, Sidebar, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ConversationItem } from "./ConversationItem";
import { CreateNewAgentModal } from "./CreateNewAgentModal";
import { SearchAgentsModal } from "./SearchAgentsModal";
import { LoadingOverlay } from "./LoadingOverlay";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAgent } from "@/contexts/AgentContext";

export const ChatSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Workspace management
  const {
    activeWorkspace,
    workspaces,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
    createWorkspaceFromDirectory,
    refreshActiveWorkspace: _refreshActiveWorkspace,
    refreshWorkspaces: _refreshWorkspaces,
    switchWorkspace,
  } = useWorkspace();

  // Agent management
  const {
    agents,
    isLoading: _isAgentLoading,
    isArchiving,
    isDeleting,
    error: _agentError,
    archiveAgent,
    deleteAgent,
    deleteArchivedAgent,
    selectAgent,
  } = useAgent();

  // Filter agents by status
  const activeAgents = agents.filter(agent =>
    agent.status.toLowerCase() !== 'archived'
  );
  const archivedAgents = agents.filter(agent =>
    agent.status.toLowerCase() === 'archived'
  );

  // Determine if New Agent button should be disabled
  const isOnHomePage = location.pathname === '/app' || location.pathname === '/';
  const hasNoWorkspace = !activeWorkspace;
  const shouldDisableNewAgent = isOnHomePage || hasNoWorkspace;


  // Handle workspace errors
  useEffect(() => {
    if (workspaceError) {
      console.error('Workspace error:', workspaceError);
      // You could show a toast notification here
    }
  }, [workspaceError]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        if (!shouldDisableNewAgent) {
          setCreateModalOpen(true);
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shouldDisableNewAgent]);

  const handleArchiveAgent = async (agentId: string) => {
    try {
      const success = await archiveAgent(agentId);
      if (success) {
        navigate('/app');
      }
    } catch (error) {
      console.error("Failed to archive agent:", error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const success = await deleteAgent(agentId);
      if (success) {
        navigate('/app');
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
    }
  };

  const handleDeleteArchivedAgent = async (agentId: string) => {
    try {
      const success = await deleteArchivedAgent(agentId);
      if (success) {
        navigate('/app');
      }
    } catch (error) {
      console.error("Failed to delete archived agent:", error);
    }
  };

  const handleOpenNewRepo = async () => {
    try {
      await createWorkspaceFromDirectory();
      // The useWorkspace hook will automatically update the active workspace
      console.log("Successfully created and switched to new workspace");
    } catch (error) {
      console.error("Failed to create workspace:", error);
      // Error is already handled by the useWorkspace hook
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId);
      console.log("Successfully switched workspace");
    } catch (error) {
      console.error("Failed to switch workspace:", error);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isArchiving} message="Archiving agent..." />
      <LoadingOverlay isLoading={isDeleting} message="Deleting agent..." />
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
                  onClick={() => setSearchModalOpen(true)}
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
            <Button
              onClick={() => setCreateModalOpen(true)}
              disabled={shouldDisableNewAgent}
              className="w-full bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-foreground border border-sidebar-border disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sidebar-accent">
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
                {showArchived && (
                  <div className="mb-4">
                    <Button
                      onClick={() => setShowArchived(false)}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3 bg-muted/50 hover:bg-muted"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to active agents
                    </Button>
                  </div>
                )}

                {showArchived ? (
                  archivedAgents.length > 0 ? (
                    archivedAgents.map((agent) => (
                      <ConversationItem
                        key={agent.id}
                        title={agent.name}
                        subtitle={`${new Date(agent.created_at).toLocaleDateString()} • ${agent.status}`}
                        isActive={false}
                        onDelete={() => handleDeleteArchivedAgent(agent.id)}
                        onClick={() => {
                          selectAgent(agent.id);
                          navigate('/agent');
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No archived agents yet...
                    </div>
                  )
                ) : (
                  activeAgents.length > 0 ? (
                    activeAgents.map((agent) => (
                      <ConversationItem
                        key={agent.id}
                        title={agent.name}
                        subtitle={`${new Date(agent.created_at).toLocaleDateString()} • ${agent.status}`}
                        isActive={agent.status === 'running'}
                        onPairMode={() => {
                          // TODO: Implement pairing mode functionality
                          console.log('Start pairing mode for agent:', agent.id);
                        }}
                        onArchive={() => handleArchiveAgent(agent.id)}
                        onDelete={() => handleDeleteAgent(agent.id)}
                        onClick={() => {
                          selectAgent(agent.id);
                          navigate('/agent');
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No agents yet. Create your first agent to get started!
                    </div>
                  )
                )}
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
                  onClick={() => setShowArchived(true)}
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
                    <button
                      className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm text-sidebar-foreground bg-sidebar-background border border-sidebar-border rounded-md hover:opacity-90 transition-colors"
                      disabled={isWorkspaceLoading}
                    >
                      <span>{activeWorkspace?.name || "No workspace"}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    className="w-73 bg-sidebar-background border-sidebar-border"
                  >
                    {/* List existing workspaces */}
                    {workspaces.map((workspace) => (
                      <DropdownMenuItem
                        key={workspace.id}
                        onClick={() => handleSwitchWorkspace(workspace.id)}
                        className="cursor-pointer text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground focus:bg-white/10 focus:text-sidebar-foreground"
                      >
                        {activeWorkspace?.id === workspace.id ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <span className="w-4 h-4 mr-2"></span>
                        )}
                        {workspace.name}
                      </DropdownMenuItem>
                    ))}

                    {workspaces.length > 0 && <DropdownMenuSeparator className="bg-sidebar-border" />}

                    {/* Open New Repo option */}
                    <DropdownMenuItem
                      onClick={handleOpenNewRepo}
                      disabled={isWorkspaceLoading}
                      className="cursor-pointer text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground focus:bg-white/10 focus:text-sidebar-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isWorkspaceLoading ? "Opening..." : "Open New Repo"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateNewAgentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      >
        <div />
      </CreateNewAgentModal>

      <SearchAgentsModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
      >
        <div />
      </SearchAgentsModal>
    </aside>
    </TooltipProvider>
    </>
  );
};
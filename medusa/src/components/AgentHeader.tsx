import { MoreHorizontal, ChevronDown, GitMerge, Users, PanelRightOpen, PanelRightClose, Copy, ArchiveIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useAgent } from "@/contexts/AgentContext";
import { useEffect, useState } from "react";

interface AgentHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AgentHeader = ({ sidebarOpen, onToggleSidebar }: AgentHeaderProps) => {
  const { agents, selectedAgentId, isArchiving, archiveAgent, stopAgent } = useAgent();
  const [currentAgent, setCurrentAgent] = useState(null);

  // Use the selected agent or fallback to most recent
  useEffect(() => {
    if (selectedAgentId) {
      // Find the selected agent (whether active or archived)
      const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
      setCurrentAgent(selectedAgent || null);
    } else if (agents.length > 0) {
      // Fallback: get the most recent active agent
      const activeAgents = agents.filter(agent => agent.status.toLowerCase() !== 'archived');
      if (activeAgents.length > 0) {
        const mostRecentActiveAgent = activeAgents[activeAgents.length - 1];
        setCurrentAgent(mostRecentActiveAgent);
      } else {
        setCurrentAgent(null);
      }
    } else {
      setCurrentAgent(null);
    }
  }, [agents, selectedAgentId]);

  const handleCopyBranchName = () => {
    if (currentAgent?.branch_name) {
      navigator.clipboard.writeText(currentAgent.branch_name);
    }
  };

  const handleArchive = async () => {
    if (currentAgent) {
      try {
        await archiveAgent(currentAgent.id);
      } catch (error) {
        console.error('Failed to archive agent:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (currentAgent) {
      try {
        await stopAgent(currentAgent.id);
      } catch (error) {
        console.error('Failed to stop agent:', error);
      }
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isArchiving} message="Archiving agent..." />
      <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{currentAgent?.name || "No Agent"}</span>
        <span className="text-sm text-muted-foreground">{currentAgent?.branch_name || "No branch"}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            className="w-56 bg-card border-border"
          >
            <DropdownMenuItem
              onClick={handleCopyBranchName}
              className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
              <Copy className="w-4 h-4 mr-2" />
              Copy Branch Name
            </DropdownMenuItem>
            {currentAgent?.status.toLowerCase() !== 'archived' && (
              <DropdownMenuItem
                onClick={handleArchive}
                className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                <ArchiveIcon className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleDelete}
              className="cursor-pointer text-red-400 hover:bg-muted hover:text-red-400 focus:bg-muted focus:text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Merge button - only show for active agents */}
        {currentAgent?.status.toLowerCase() !== 'archived' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors">
                <GitMerge className="w-4 h-4" />
                <span>Merge</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border-border"
            >
              <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                <span className="w-4 h-4 mr-2"></span>
                Merge branch
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                <span className="w-4 h-4 mr-2"></span>
                Create pull request
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                <span className="w-4 h-4 mr-2"></span>
                Fast forward
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Pairing Mode button - only show for active agents */}
        {currentAgent?.status.toLowerCase() !== 'archived' && (
          <Button variant="secondary" size="sm" className="h-8 px-3">
            <Users className="w-3 h-3 mr-1" />
            Pairing Mode
          </Button>
        )}

        {/* Sidebar toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleSidebar}>
          {sidebarOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </Button>
      </div>
    </header>
    </>
  );
};
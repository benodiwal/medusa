import { MoreHorizontal, ChevronDown, GitMerge, Users, PanelRightOpen, PanelRightClose, Copy, ArchiveIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AgentHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AgentHeader = ({ sidebarOpen, onToggleSidebar }: AgentHeaderProps) => {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Hi</span>
        <span className="text-sm text-muted-foreground">sculptor/vengeful-straight-peccary</span>
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
            <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
              <Copy className="w-4 h-4 mr-2" />
              Copy Branch Name
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
              <ArchiveIcon className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-red-400 hover:bg-muted hover:text-red-400 focus:bg-muted focus:text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Merge button */}
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

        {/* Pairing Mode button */}
        <Button variant="secondary" size="sm" className="h-8 px-3">
          <Users className="w-3 h-3 mr-1" />
          Pairing Mode
        </Button>

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
  );
};
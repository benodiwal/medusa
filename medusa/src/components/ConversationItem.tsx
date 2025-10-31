import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Copy, MoreHorizontal, Trash2, ArrowUpDown, ArchiveIcon } from "lucide-react";

interface ConversationItemProps {
  title: string;
  subtitle: string;
  isActive?: boolean;
  onClick?: () => void;
  onPairMode?: () => void;
  onCopyBranch?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export const ConversationItem = ({
  title,
  subtitle,
  isActive = false,
  onClick,
  onPairMode,
  onCopyBranch,
  onArchive,
  onDelete
}: ConversationItemProps) => {
  return (
    <div className="w-full text-left px-1 py-2 text-sm">
      <div
        onClick={onClick}
        className={`flex items-center gap-3 cursor-pointer p-2 ${
          isActive ? "bg-secondary/80" : "hover:bg-secondary/50"
        }`}
      >
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="flex-1 truncate">
          <div className="font-medium text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground truncate">
            {subtitle}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onPairMode && (
            <TooltipButton
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onPairMode?.();
              }}
              className="h-8 w-8 text-muted-foreground hover:bg-secondary"
              tooltip="Start Pairing Mode"
              tooltipSide="top"
            >
              <ArrowUpDown className="w-4 h-4" />
            </TooltipButton>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-white/10 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="right"
              className="w-56 bg-sidebar-background border-sidebar-border"
            >
              <DropdownMenuItem
                onClick={onCopyBranch}
                className="cursor-pointer text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground focus:bg-white/10 focus:text-sidebar-foreground"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Branch Name
              </DropdownMenuItem>
              {onArchive && (
                <DropdownMenuItem
                  onClick={onArchive}
                  className="cursor-pointer text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground focus:bg-white/10 focus:text-sidebar-foreground"
                >
                  <ArchiveIcon className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-red-400 hover:bg-white/10 hover:text-red-400 focus:bg-white/10 focus:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
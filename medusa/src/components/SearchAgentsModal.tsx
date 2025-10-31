import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from "@/components/ui/dialog";
import { Search, X } from "lucide-react";
import { useAgent } from "@/contexts/AgentContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { AgentResponse } from "@/lib/api/types";

interface SearchAgentsModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SearchAgentsModal = ({ children, open, onOpenChange }: SearchAgentsModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAgents, setFilteredAgents] = useState<AgentResponse[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const { selectAgent, searchAgents } = useAgent();
  const { activeWorkspace } = useWorkspace();

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim() === "") {
        setFilteredAgents([]);
        return;
      }

      try {
        setIsSearching(true);
        const results = await searchAgents(searchQuery);
        setFilteredAgents(results);
      } catch (error) {
        console.error("Search failed:", error);
        setFilteredAgents([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, searchAgents]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setSearchQuery("");
      setFilteredAgents([]);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredAgents]);

  const handleAgentSelect = (agent: AgentResponse) => {
    selectAgent(agent.id);
    navigate('/agent');
    onOpenChange?.(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      onOpenChange?.(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex(prev =>
        prev < filteredAgents.length - 1 ? prev + 1 : prev
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (filteredAgents[selectedIndex]) {
        handleAgentSelect(filteredAgents[selectedIndex]);
      }
      return;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 bg-background border-border">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground mr-3" />
            <input
              type="text"
              placeholder="Search agents by name, task, branch, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            <button
              onClick={() => onOpenChange?.(false)}
              className="ml-3 p-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                Searching...
              </div>
            ) : searchQuery.trim() === "" ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                Start typing to search agents in {activeWorkspace?.name || "workspace"}
              </div>
            ) : filteredAgents.length > 0 ? (
              <div className="py-2">
                {filteredAgents.map((agent, index) => (
                  <button
                    key={agent.id}
                    onClick={() => handleAgentSelect(agent)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? "bg-secondary"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {agent.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {agent.task}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                        {agent.branch_name}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded font-medium ${
                        agent.status.toLowerCase() === 'running'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : agent.status.toLowerCase() === 'archived'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {agent.status}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No agents found matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>↑↓ to navigate</span>
              <span>⏎ to open</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
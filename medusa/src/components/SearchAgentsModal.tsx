import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from "@/components/ui/dialog";
import { Search, X } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  repository: string;
}

interface SearchAgentsModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Mock agent data - replace with real data later
const mockAgents: Agent[] = [
  {
    id: "1",
    name: "hi there",
    repository: "sculptor/opalescent-cuddly-monkey"
  },
  {
    id: "2",
    name: "Hi",
    repository: "sculptor/vengeful-straight-peccary"
  },
  {
    id: "3",
    name: "Debug API",
    repository: "sculptor/amazing-coding-helper"
  },
  {
    id: "4",
    name: "UI Designer",
    repository: "sculptor/creative-design-agent"
  }
];

export const SearchAgentsModal = ({ children, open, onOpenChange }: SearchAgentsModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>(mockAgents);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAgents(mockAgents);
    } else {
      const filtered = mockAgents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.repository.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAgents(filtered);
    }
    setSelectedIndex(0); // Reset selection when results change
  }, [searchQuery]);

  // Reset selected index when modal opens
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setSearchQuery("");
    }
  }, [open]);

  const handleAgentSelect = (agent: Agent) => {
    console.log("Selected agent:", agent);
    onOpenChange?.(false);
    // TODO: Navigate to agent or perform action
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
              placeholder="Search for agent..."
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
            {filteredAgents.length > 0 ? (
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
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {agent.name}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {agent.repository}
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
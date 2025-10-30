import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { FolderOpen, GitBranch, Loader2 } from "lucide-react";

export const WorkspaceSetup = () => {
  const { createWorkspaceFromDirectory, isLoading, error } = useWorkspace();

  const handleOpenRepository = async () => {
    try {
      await createWorkspaceFromDirectory();
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center h-screen bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-sm">
        <div className="text-center space-y-2 p-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <GitBranch className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Welcome to Medusa</h1>
          <p className="text-sm text-muted-foreground">
            Get started by opening a repository to create your first workspace
          </p>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <Button
            onClick={handleOpenRepository}
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4 mr-2" />
                Open Repository
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-muted border border-border rounded-md">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              You can also open a repository using the sidebar dropdown
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
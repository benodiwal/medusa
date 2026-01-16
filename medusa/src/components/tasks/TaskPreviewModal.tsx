import { useEffect } from 'react';
import { X, CheckCircle, Clock, FileCode, GitCommit, FolderOpen, GitBranch } from 'lucide-react';
import { Task } from '../../types';

interface TaskPreviewModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskPreviewModal({ task, onClose }: TaskPreviewModalProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getDuration = () => {
    if (!task.started_at || !task.completed_at) return null;
    const seconds = task.completed_at - task.started_at;
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  // Parse commit message from diff_summary
  const getCommitMessage = () => {
    if (!task.diff_summary) return null;
    const firstPipe = task.diff_summary.indexOf('|');
    if (firstPipe === -1) return task.diff_summary;
    return task.diff_summary.substring(0, firstPipe);
  };

  // Parse commits from diff_summary
  const getCommits = () => {
    if (!task.diff_summary || !task.diff_summary.includes('|')) return [];
    return task.diff_summary
      .split('|')
      .slice(1)
      .join('|')
      .split('\n')
      .filter(l => l.trim())
      .map(line => {
        const parts = line.split('|');
        return {
          hash: parts[0] || '',
          message: parts[1] || line
        };
      });
  };

  const projectName = task.project_path.split('/').pop() || 'Unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] m-4 bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{task.title}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FolderOpen className="w-3 h-3" />
                <span>{projectName}</span>
                {task.branch && (
                  <>
                    <span>·</span>
                    <GitBranch className="w-3 h-3" />
                    <span>{task.branch}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Commit Message */}
          {getCommitMessage() && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Commit Message</h3>
              <p className="text-foreground bg-muted/50 rounded-lg p-3 font-mono text-sm">
                {getCommitMessage()}
              </p>
            </div>
          )}

          {/* Files Changed */}
          {task.files_changed && task.files_changed.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Files Changed ({task.files_changed.length})
              </h3>
              <div className="space-y-1">
                {task.files_changed.map((file, index) => (
                  <div
                    key={index}
                    className="text-sm text-muted-foreground font-mono py-1.5 px-3 bg-muted/30 rounded"
                  >
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commits */}
          {getCommits().length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <GitCommit className="w-4 h-4" />
                Commits
              </h3>
              <div className="space-y-2">
                {getCommits().map((commit, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">
                      {commit.hash}
                    </span>
                    <span className="text-foreground">{commit.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              {task.created_at && (
                <span>Created: {formatDate(task.created_at)}</span>
              )}
              {task.completed_at && (
                <span>Completed: {formatDate(task.completed_at)}</span>
              )}
            </div>
            {getDuration() && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Duration: {getDuration()}</span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

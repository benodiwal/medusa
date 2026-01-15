import { Clock, Play, Trash2, GitBranch, FolderOpen, Terminal, Eye, Pause, Send, Loader2, CheckCircle, FileCode } from 'lucide-react';
import { Task, TaskStatus } from '../../types';

interface TaskCardProps {
  task: Task;
  onOpen?: () => void;
  onDelete: () => void;
  onStartAgent?: () => void;
  onStopAgent?: () => void;
  onSendToReview?: () => void;
  onViewOutput?: () => void;
  isDragging?: boolean;
  isCommitting?: boolean;
}

export function TaskCard({
  task,
  onOpen,
  onDelete,
  onStartAgent,
  onStopAgent,
  onSendToReview,
  onViewOutput,
  isDragging,
  isCommitting,
}: TaskCardProps) {
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getDuration = (startedAt?: number, completedAt?: number) => {
    if (!startedAt || !completedAt) return null;
    const seconds = completedAt - startedAt;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  // Parse diff_summary to get commit message (format: "message|hash|msg\nhash|msg...")
  const getCommitMessage = () => {
    if (!task.diff_summary) return null;
    const firstPipe = task.diff_summary.indexOf('|');
    if (firstPipe === -1) return task.diff_summary;
    return task.diff_summary.substring(0, firstPipe);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Backlog:
        return 'bg-muted text-muted-foreground';
      case TaskStatus.InProgress:
        return 'bg-primary/10 text-primary';
      case TaskStatus.Review:
        return 'bg-primary/10 text-primary';
      case TaskStatus.Done:
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const projectName = task.project_path.split('/').pop() || 'Unknown';
  const isRunning = !!task.agent_pid;
  const isPaused = !task.agent_pid && !!task.session_id && task.status === TaskStatus.InProgress;
  const isInProgressNotRunning = task.status === TaskStatus.InProgress && !task.agent_pid;
  const canStart = task.status === TaskStatus.Backlog;
  const canResume = isPaused;

  return (
    <div
      className={`
        group relative bg-card border rounded-lg p-4 transition-all
        ${isDragging ? 'border-primary shadow-lg scale-105' : 'border-border'}
        ${onOpen ? 'cursor-pointer hover:border-primary/50' : ''}
        ${task.status === TaskStatus.Done ? 'opacity-75' : ''}
      `}
      onClick={() => onOpen?.()}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
        {isRunning ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
            Running
          </span>
        ) : isPaused ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Pause className="w-3 h-3" />
            Paused
          </span>
        ) : null}
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Project & Branch */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FolderOpen className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{projectName}</span>
        </div>
        {task.branch && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <GitBranch className="w-3 h-3" />
            <span className="truncate max-w-[80px]">{task.branch}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{getTimeAgo(task.created_at)}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Start Agent button - shown for backlog tasks */}
          {canStart && !isRunning && onStartAgent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartAgent();
              }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Start Agent"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Resume Agent button - shown for paused tasks */}
          {canResume && onStartAgent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartAgent();
              }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Resume Agent"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Pause Agent button - shown when running */}
          {isRunning && onStopAgent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStopAgent();
              }}
              className="p-1.5 text-muted-foreground hover:text-muted-foreground/80 hover:bg-muted rounded transition-colors"
              title="Pause Agent"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Send to Review button - shown for InProgress tasks that are paused */}
          {isPaused && onSendToReview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendToReview();
              }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Send to Review"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}

          {/* View Output button - shown when running, paused, or in review */}
          {(isRunning || isPaused || task.status === TaskStatus.Review) && onViewOutput && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewOutput();
              }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="View Output"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          )}

          {/* View Diff button - shown for review status */}
          {task.status === TaskStatus.Review && onOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="View Changes"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Done task summary */}
      {task.status === TaskStatus.Done && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {/* Commit message */}
          {getCommitMessage() && (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground line-clamp-2">{getCommitMessage()}</p>
            </div>
          )}
          {/* Files and duration */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.files_changed && task.files_changed.length > 0 && (
              <span className="flex items-center gap-1">
                <FileCode className="w-3 h-3" />
                {task.files_changed.length} file{task.files_changed.length !== 1 ? 's' : ''}
              </span>
            )}
            {getDuration(task.started_at, task.completed_at) && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getDuration(task.started_at, task.completed_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress indicator for running tasks */}
      {isRunning && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-1/2" />
            </div>
            <span className="text-xs text-muted-foreground">Working...</span>
          </div>
        </div>
      )}

      {/* Committing indicator */}
      {isCommitting && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg">
            <Loader2 className="w-3 h-3 animate-spin" />
            Committing changes...
          </div>
        </div>
      )}

      {/* Send to Review button - shown for any InProgress task that's not running */}
      {!isCommitting && isInProgressNotRunning && onSendToReview && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendToReview();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Send className="w-3 h-3" />
            Send to Review
          </button>
        </div>
      )}
    </div>
  );
}

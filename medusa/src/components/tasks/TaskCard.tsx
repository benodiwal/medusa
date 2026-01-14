import { Clock, Play, Square, Trash2, GitBranch, FolderOpen, Terminal, Eye } from 'lucide-react';
import { Task, TaskStatus } from '../../types';

interface TaskCardProps {
  task: Task;
  onOpen?: () => void;
  onDelete: () => void;
  onStartAgent?: () => void;
  onStopAgent?: () => void;
  onViewOutput?: () => void;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  onOpen,
  onDelete,
  onStartAgent,
  onStopAgent,
  onViewOutput,
  isDragging,
}: TaskCardProps) {
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Backlog:
        return 'bg-gray-500/10 text-gray-500';
      case TaskStatus.Planning:
        return 'bg-blue-500/10 text-blue-500';
      case TaskStatus.InProgress:
        return 'bg-amber-500/10 text-amber-500';
      case TaskStatus.Review:
        return 'bg-purple-500/10 text-purple-500';
      case TaskStatus.Done:
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const projectName = task.project_path.split('/').pop() || 'Unknown';
  const isRunning = !!task.agent_pid;
  const canStart = task.status === TaskStatus.Backlog || task.status === TaskStatus.Planning;

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
        {isRunning && (
          <span className="flex items-center gap-1 text-xs text-amber-500">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Running
          </span>
        )}
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
          {/* Start Agent button - shown for backlog/planning tasks */}
          {canStart && !isRunning && onStartAgent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartAgent();
              }}
              className="p-1.5 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded transition-colors"
              title="Start Agent"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Stop Agent button - shown when running */}
          {isRunning && onStopAgent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStopAgent();
              }}
              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
              title="Stop Agent"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}

          {/* View Output button - shown when running or has output */}
          {(isRunning || task.status === TaskStatus.Review) && onViewOutput && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewOutput();
              }}
              className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
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
              className="p-1.5 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 rounded transition-colors"
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

      {/* Files changed for completed tasks */}
      {task.status === TaskStatus.Done && task.files_changed && task.files_changed.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {task.files_changed.length} file{task.files_changed.length !== 1 ? 's' : ''} changed
          </p>
        </div>
      )}

      {/* Progress indicator for running tasks */}
      {isRunning && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full animate-pulse w-1/2" />
            </div>
            <span className="text-xs text-muted-foreground">Working...</span>
          </div>
        </div>
      )}
    </div>
  );
}

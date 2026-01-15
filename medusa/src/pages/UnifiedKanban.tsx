import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  Settings,
  RefreshCw,
  Search,
  X,
  Clock,
  Plus,
  CheckSquare,
  Play,
  Pause,
  Trash2,
  Eye,
  Send,
  Terminal,
  FolderOpen,
  GitBranch,
  Loader2,
  CheckCircle,
  FileCode,
} from 'lucide-react';
import { PlanItem, PlanStatus, Task, TaskStatus } from '../types';
import { PlanCard } from '../components/kanban/PlanCard';
import { PlanReviewModal } from '../components/kanban/PlanReviewModal';
import { CreateTaskModal, AgentOutputModal } from '../components/tasks';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

// Unified column definitions
const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'text-muted-foreground' },
  { id: 'in_progress', label: 'In Progress', color: 'text-primary' },
  { id: 'review', label: 'Review', color: 'text-primary' },
  { id: 'done', label: 'Done', color: 'text-muted-foreground' },
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

interface AgentStatusEvent {
  task_id: string;
  status: string;
  message?: string;
}

export default function UnifiedKanban() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [outputTask, setOutputTask] = useState<Task | null>(null);
  const [committingTaskId, setCommittingTaskId] = useState<string | null>(null);

  // Notifications
  const previousPlanIdsRef = useRef<Set<string>>(new Set());
  const notificationPermissionRef = useRef<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Setup notifications
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        let granted = await isPermissionGranted();
        if (!granted) {
          const permission = await requestPermission();
          granted = permission === 'granted';
        }
        notificationPermissionRef.current = granted;
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    };
    setupNotifications();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [allPlans, allTasks] = await Promise.all([
        invoke<PlanItem[]>('get_all_plans'),
        invoke<Task[]>('get_all_tasks'),
      ]);

      // Check for new pending plans and notify
      const currentPendingIds = new Set(
        allPlans.filter(p => p.status === PlanStatus.Pending).map(p => p.id)
      );

      if (previousPlanIdsRef.current.size > 0 && notificationPermissionRef.current) {
        const newPlans = allPlans.filter(
          p => p.status === PlanStatus.Pending && !previousPlanIdsRef.current.has(p.id)
        );

        for (const plan of newPlans) {
          sendNotification({
            title: 'New Plan for Review',
            body: `${plan.project_name}: Plan ready for review`,
          });
        }
      }

      previousPlanIdsRef.current = currentPendingIds;
      setPlans(allPlans);
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Listen for agent status changes
  useEffect(() => {
    const unlisten = listen<AgentStatusEvent>('agent-status', () => {
      loadData();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [loadData]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter items by search
  const filteredPlans = plans.filter(p =>
    !searchQuery ||
    p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = tasks.filter(t =>
    !searchQuery ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.project_path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map items to columns
  const getColumnItems = (columnId: ColumnId) => {
    const items: { type: 'plan' | 'task'; data: PlanItem | Task }[] = [];

    switch (columnId) {
      case 'backlog':
        // Only tasks in backlog
        filteredTasks
          .filter(t => t.status === TaskStatus.Backlog)
          .forEach(t => items.push({ type: 'task', data: t }));
        break;

      case 'in_progress':
        // Tasks that are in progress (with or without agent running)
        filteredTasks
          .filter(t => t.status === TaskStatus.InProgress)
          .forEach(t => items.push({ type: 'task', data: t }));
        // Plans that are being worked on (changes requested)
        filteredPlans
          .filter(p => p.status === PlanStatus.ChangesRequested)
          .forEach(p => items.push({ type: 'plan', data: p }));
        break;

      case 'review':
        // Tasks ready for review
        filteredTasks
          .filter(t => t.status === TaskStatus.Review)
          .forEach(t => items.push({ type: 'task', data: t }));
        // Plans pending or in review
        filteredPlans
          .filter(p => p.status === PlanStatus.Pending || p.status === PlanStatus.InReview)
          .forEach(p => items.push({ type: 'plan', data: p }));
        break;

      case 'done':
        // Completed tasks
        filteredTasks
          .filter(t => t.status === TaskStatus.Done)
          .forEach(t => items.push({ type: 'task', data: t }));
        // Approved plans
        filteredPlans
          .filter(p => p.status === PlanStatus.Approved)
          .forEach(p => items.push({ type: 'plan', data: p }));
        break;
    }

    return items;
  };

  // Plan handlers
  const handleOpenPlan = async (plan: PlanItem) => {
    try {
      await invoke('start_review', { id: plan.id });
      setSelectedPlan({ ...plan, status: PlanStatus.InReview });
      loadData();
    } catch (error) {
      console.error('Failed to start review:', error);
    }
  };

  const handleRemovePlan = async (id: string) => {
    try {
      await invoke('remove_plan', { id });
      loadData();
    } catch (error) {
      console.error('Failed to remove plan:', error);
    }
  };

  // Task handlers
  const handleCreateTask = async (title: string, description: string, projectPath: string) => {
    try {
      await invoke('create_task', {
        request: { title, description, project_path: projectPath },
      });
      setShowCreateTaskModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const task = tasks.find(t => t.id === id);
      if (task?.agent_pid) {
        await invoke('cleanup_task_agent', { taskId: id });
      }
      await invoke('delete_task', { id });
      loadData();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleStartAgent = async (task: Task) => {
    try {
      await invoke('start_task_agent', { taskId: task.id });
      loadData();
    } catch (error) {
      console.error('Failed to start agent:', error);
      alert(`Failed to start agent: ${error}`);
    }
  };

  const handleStopAgent = async (task: Task) => {
    try {
      await invoke('stop_task_agent', { taskId: task.id });
      loadData();
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  const handleSendToReview = async (task: Task) => {
    try {
      if (task.worktree_path) {
        const changedFiles = await invoke<string[]>('get_task_changed_files', { taskId: task.id });
        if (changedFiles.length === 0) {
          alert('Cannot send to review: No files have been changed.');
          return;
        }
      }
      setCommittingTaskId(task.id);
      await invoke('send_task_to_review', { taskId: task.id });
      loadData();
    } catch (error) {
      console.error('Failed to send to review:', error);
      alert(`Failed to send to review: ${error}`);
    } finally {
      setCommittingTaskId(null);
    }
  };

  // Count items
  const totalItems = plans.length + tasks.length;
  const runningAgents = tasks.filter(t => t.agent_pid).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/medusa-logo.png"
                alt="Medusa"
                className="w-7 h-7 object-contain"
              />
              <h1 className="text-base font-semibold text-foreground">Medusa</h1>
            </div>
            {totalItems > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {tasks.length} tasks · {plans.length} plans
              </span>
            )}
            {runningAgents > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {runningAgents} running
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-8 py-1.5 text-sm bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
                  ⌘K
                </kbd>
              )}
            </div>

            <div className="h-5 w-px bg-border" />

            <button
              onClick={loadData}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/history')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="History"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-4 min-h-full">
          {COLUMNS.map((column) => {
            const items = getColumnItems(column.id);

            return (
              <div
                key={column.id}
                className="flex-1 min-w-[280px] max-w-[350px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className={`text-sm font-medium ${column.color}`}>
                      {column.label}
                    </h2>
                    {items.length > 0 && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        {items.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    item.type === 'plan' ? (
                      <PlanCard
                        key={`plan-${(item.data as PlanItem).id}`}
                        plan={item.data as PlanItem}
                        onOpen={() => handleOpenPlan(item.data as PlanItem)}
                        onRemove={() => handleRemovePlan((item.data as PlanItem).id)}
                        isActive={(item.data as PlanItem).status === PlanStatus.InReview}
                        isCompleted={(item.data as PlanItem).status === PlanStatus.Approved}
                      />
                    ) : (
                      <TaskCardInline
                        key={`task-${(item.data as Task).id}`}
                        task={item.data as Task}
                        onOpen={() => navigate(`/tasks/${(item.data as Task).id}`)}
                        onDelete={() => handleDeleteTask((item.data as Task).id)}
                        onStartAgent={() => handleStartAgent(item.data as Task)}
                        onStopAgent={() => handleStopAgent(item.data as Task)}
                        onSendToReview={() => handleSendToReview(item.data as Task)}
                        onViewOutput={() => setOutputTask(item.data as Task)}
                        isCommitting={committingTaskId === (item.data as Task).id}
                      />
                    )
                  ))}

                  {items.length === 0 && (
                    <div className="border border-dashed border-border rounded-lg p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        {column.id === 'backlog' ? 'No tasks in backlog' :
                         column.id === 'in_progress' ? 'Nothing in progress' :
                         column.id === 'review' ? 'Nothing to review' :
                         'Nothing completed yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modals */}
      {selectedPlan && (
        <PlanReviewModal
          plan={selectedPlan}
          onClose={() => {
            setSelectedPlan(null);
            loadData();
          }}
          onComplete={loadData}
        />
      )}

      {showCreateTaskModal && (
        <CreateTaskModal
          onClose={() => setShowCreateTaskModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {outputTask && (
        <AgentOutputModal
          task={outputTask}
          onClose={() => setOutputTask(null)}
        />
      )}
    </div>
  );
}

// Inline Task Card Component
function TaskCardInline({
  task,
  onOpen,
  onDelete,
  onStartAgent,
  onStopAgent,
  onSendToReview,
  onViewOutput,
  isCommitting,
}: {
  task: Task;
  onOpen: () => void;
  onDelete: () => void;
  onStartAgent: () => void;
  onStopAgent: () => void;
  onSendToReview: () => void;
  onViewOutput: () => void;
  isCommitting: boolean;
}) {
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
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getCommitMessage = () => {
    if (!task.diff_summary) return null;
    const firstPipe = task.diff_summary.indexOf('|');
    if (firstPipe === -1) return task.diff_summary;
    return task.diff_summary.substring(0, firstPipe);
  };

  const projectName = task.project_path.split('/').pop() || 'Unknown';
  const isRunning = !!task.agent_pid;
  const isPaused = !task.agent_pid && !!task.session_id && task.status === TaskStatus.InProgress;
  const isInProgressNotRunning = task.status === TaskStatus.InProgress && !task.agent_pid;
  const canStart = task.status === TaskStatus.Backlog;
  const canResume = isPaused;

  return (
    <div
      className={`group relative bg-card border rounded-lg p-4 transition-all cursor-pointer hover:border-primary/50 ${
        task.status === TaskStatus.Done ? 'opacity-75' : ''
      }`}
      onClick={onOpen}
    >
      {/* Type badge + Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
            <CheckSquare className="w-3 h-3" />
            Task
          </span>
        </div>
        {isRunning ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
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
          {canStart && !isRunning && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartAgent(); }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Start Agent"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {canResume && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartAgent(); }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Resume Agent"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {isRunning && (
            <button
              onClick={(e) => { e.stopPropagation(); onStopAgent(); }}
              className="p-1.5 text-muted-foreground hover:text-muted-foreground/80 hover:bg-muted rounded transition-colors"
              title="Pause Agent"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {isPaused && (
            <button
              onClick={(e) => { e.stopPropagation(); onSendToReview(); }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Send to Review"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}

          {(isRunning || isPaused || task.status === TaskStatus.Review) && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewOutput(); }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="View Output"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          )}

          {task.status === TaskStatus.Review && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="View Changes"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
          {getCommitMessage() && (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground line-clamp-2">{getCommitMessage()}</p>
            </div>
          )}
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

      {/* Send to Review button */}
      {!isCommitting && isInProgressNotRunning && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={(e) => { e.stopPropagation(); onSendToReview(); }}
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

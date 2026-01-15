import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ArrowLeft, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { TaskCard, CreateTaskModal, AgentOutputModal } from '../components/tasks';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: TaskStatus.Backlog, label: 'Backlog', color: 'text-muted-foreground' },
  { status: TaskStatus.InProgress, label: 'In Progress', color: 'text-primary' },
  { status: TaskStatus.Review, label: 'Review', color: 'text-primary' },
  { status: TaskStatus.Done, label: 'Done', color: 'text-muted-foreground' },
];

interface AgentStatusEvent {
  task_id: string;
  status: string;
  message?: string;
}

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [outputTask, setOutputTask] = useState<Task | null>(null);
  const [committingTaskId, setCommittingTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const allTasks = await invoke<Task[]>('get_all_tasks');
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();

    // Poll for task updates (agent status changes, etc.)
    const interval = setInterval(loadTasks, 3000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  // Listen for agent status changes
  useEffect(() => {
    const unlisten = listen<AgentStatusEvent>('agent-status', (event) => {
      console.log('Agent status changed:', event.payload);
      loadTasks();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [loadTasks]);

  const handleCreateTask = async (title: string, description: string, projectPath: string) => {
    try {
      await invoke('create_task', {
        request: { title, description, project_path: projectPath },
      });
      setShowCreateModal(false);
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      // Cleanup agent if running
      const task = tasks.find((t) => t.id === id);
      if (task?.agent_pid) {
        await invoke('cleanup_task_agent', { taskId: id });
      }
      await invoke('delete_task', { id });
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await invoke('update_task_status', { id: taskId, status: newStatus });
      loadTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleStartAgent = async (task: Task) => {
    try {
      await invoke('start_task_agent', { taskId: task.id });
      loadTasks();
    } catch (error) {
      console.error('Failed to start agent:', error);
      alert(`Failed to start agent: ${error}`);
    }
  };

  const handleStopAgent = async (task: Task) => {
    try {
      await invoke('stop_task_agent', { taskId: task.id });
      loadTasks();
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  const handleSendToReview = async (task: Task) => {
    try {
      // Check if there are any changed files before sending to review
      if (task.worktree_path) {
        const changedFiles = await invoke<string[]>('get_task_changed_files', { taskId: task.id });
        if (changedFiles.length === 0) {
          alert('Cannot send to review: No files have been changed.');
          return;
        }
      }
      // Show committing state while Claude Code generates commit message
      setCommittingTaskId(task.id);
      // This will auto-commit using Claude Code if there are uncommitted changes
      await invoke('send_task_to_review', { taskId: task.id });
      loadTasks();
    } catch (error) {
      console.error('Failed to send to review:', error);
      alert(`Failed to send to review: ${error}`);
    } finally {
      setCommittingTaskId(null);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask && draggedTask.status !== status) {
      handleUpdateStatus(draggedTask.id, status);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project_path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = filteredTasks.filter((t) => t.status === col.status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Count running agents
  const runningAgents = tasks.filter((t) => t.agent_pid).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading tasks...</p>
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
            <button
              onClick={() => navigate('/')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/medusa-logo.png"
                alt="Medusa"
                className="w-7 h-7 object-contain"
              />
              <h1 className="text-base font-semibold text-foreground">Tasks</h1>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {tasks.length} tasks
            </span>
            {runningAgents > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                {runningAgents} agent{runningAgents !== 1 ? 's' : ''} running
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-8 py-1.5 text-sm bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="h-5 w-px bg-border" />

            <button
              onClick={loadTasks}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
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
          {COLUMNS.map((column) => (
            <div
              key={column.status}
              className={`flex-1 min-w-[280px] max-w-[350px] rounded-lg p-2 -m-2 transition-colors ${
                dragOverColumn === column.status ? 'bg-primary/10' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(column.status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm font-medium ${column.color}`}>
                    {column.label}
                  </h2>
                  {tasksByStatus[column.status].length > 0 && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {tasksByStatus[column.status].length}
                    </span>
                  )}
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {tasksByStatus[column.status].map((task) => (
                  <div
                    key={task.id}
                    draggable={!task.agent_pid} // Disable drag while agent is running
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                  >
                    <TaskCard
                      task={task}
                      onOpen={() => navigate(`/tasks/${task.id}`)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onStartAgent={() => handleStartAgent(task)}
                      onStopAgent={() => handleStopAgent(task)}
                      onSendToReview={() => handleSendToReview(task)}
                      onViewOutput={() => setOutputTask(task)}
                      isDragging={draggedTask?.id === task.id}
                      isCommitting={committingTaskId === task.id}
                    />
                  </div>
                ))}

                {tasksByStatus[column.status].length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {column.status === TaskStatus.Backlog
                        ? 'No tasks yet'
                        : `No ${column.label.toLowerCase()} tasks`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {/* Agent Output Modal */}
      {outputTask && (
        <AgentOutputModal
          task={outputTask}
          onClose={() => setOutputTask(null)}
        />
      )}
    </div>
  );
}

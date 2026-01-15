import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import {
  Settings,
  Clock,
  FileText,
  CheckSquare,
  ArrowRight,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileCode,
  GitBranch
} from 'lucide-react';
import { PlanItem, PlanStatus, Task, TaskStatus } from '../types';

interface ActivityItem {
  id: string;
  type: 'plan' | 'task';
  action: string;
  title: string;
  timestamp: number;
  status?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [allPlans, allTasks] = await Promise.all([
        invoke<PlanItem[]>('get_all_plans'),
        invoke<Task[]>('get_all_tasks'),
      ]);
      setPlans(allPlans);
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Calculate plan stats
  const planStats = {
    pending: plans.filter(p => p.status === PlanStatus.Pending).length,
    inReview: plans.filter(p => p.status === PlanStatus.InReview).length,
    working: plans.filter(p => p.status === PlanStatus.ChangesRequested).length,
    approved: plans.filter(p => p.status === PlanStatus.Approved).length,
    total: plans.length,
  };

  // Calculate task stats
  const taskStats = {
    backlog: tasks.filter(t => t.status === TaskStatus.Backlog).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.InProgress).length,
    review: tasks.filter(t => t.status === TaskStatus.Review).length,
    done: tasks.filter(t => t.status === TaskStatus.Done).length,
    running: tasks.filter(t => t.agent_pid).length,
    total: tasks.length,
  };

  // Generate recent activity (last 10 items combined)
  const recentActivity: ActivityItem[] = [
    ...plans.map(p => ({
      id: p.id,
      type: 'plan' as const,
      action: getActionForPlanStatus(p.status),
      title: p.project_name,
      timestamp: p.created_at,
      status: p.status,
    })),
    ...tasks.map(t => ({
      id: t.id,
      type: 'task' as const,
      action: getActionForTaskStatus(t.status, !!t.agent_pid),
      title: t.title,
      timestamp: t.updated_at || t.created_at,
      status: t.status,
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  function getActionForPlanStatus(status: PlanStatus): string {
    switch (status) {
      case PlanStatus.Pending: return 'awaiting review';
      case PlanStatus.InReview: return 'being reviewed';
      case PlanStatus.ChangesRequested: return 'changes in progress';
      case PlanStatus.Approved: return 'was approved';
      case PlanStatus.Denied: return 'was denied';
      default: return 'updated';
    }
  }

  function getActionForTaskStatus(status: TaskStatus, isRunning: boolean): string {
    if (isRunning) return 'agent running';
    switch (status) {
      case TaskStatus.Backlog: return 'in backlog';
      case TaskStatus.InProgress: return 'in progress';
      case TaskStatus.Review: return 'ready for review';
      case TaskStatus.Done: return 'completed';
      default: return 'updated';
    }
  }

  function getTimeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

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
          <div className="flex items-center gap-2">
            <img
              src="/medusa-logo.png"
              alt="Medusa"
              className="w-7 h-7 object-contain"
            />
            <h1 className="text-base font-semibold text-foreground">Medusa</h1>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Here's what's happening across your projects
          </p>
        </div>

        {/* Two Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Plans Card */}
          <div
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => navigate('/plans')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Plans</h3>
                  <p className="text-xs text-muted-foreground">Review & annotate AI plans</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>

            {/* Plan Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{planStats.pending}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">In Review</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{planStats.inReview}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <PlayCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Working</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{planStats.working}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-muted-foreground">Approved</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{planStats.approved}</p>
              </div>
            </div>

            {planStats.total === 0 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                No plans yet. Plans will appear when Claude enters plan mode.
              </p>
            )}
          </div>

          {/* Tasks Card */}
          <div
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => navigate('/tasks')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Tasks</h3>
                  <p className="text-xs text-muted-foreground">Parallel agent execution</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>

            {/* Task Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Backlog</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{taskStats.backlog}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {taskStats.running > 0 ? (
                    <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span className="text-xs text-muted-foreground">Running</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{taskStats.running}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Review</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{taskStats.review}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-muted-foreground">Done</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{taskStats.done}</p>
              </div>
            </div>

            {taskStats.total === 0 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                No tasks yet. Create a task to start an autonomous agent.
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                  onClick={() => {
                    if (activity.type === 'plan') {
                      navigate('/plans');
                    } else {
                      navigate(`/tasks/${activity.id}`);
                    }
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activity.type === 'plan' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {activity.type === 'plan' ? (
                      <FileText className="w-4 h-4 text-primary" />
                    ) : (
                      <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      <span className="font-medium">{activity.title}</span>
                      <span className="text-muted-foreground"> {activity.action}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State when no data */}
        {plans.length === 0 && tasks.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <img
              src="/medusa-logo.png"
              alt="Medusa"
              className="w-12 h-12 object-contain mx-auto mb-4 opacity-50"
            />
            <h3 className="font-semibold text-foreground mb-2">Get Started with Medusa</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Use <strong>Plans</strong> to review Claude's implementation plans with rich annotations,
              or <strong>Tasks</strong> to run parallel autonomous agents on your codebase.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => navigate('/plans')}
                className="px-4 py-2 text-sm font-medium bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Setup Plans
              </button>
              <button
                onClick={() => navigate('/tasks')}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Task
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

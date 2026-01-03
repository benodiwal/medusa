import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { Settings, RefreshCw, Search, X, Clock } from 'lucide-react';
import { PlanItem, PlanStatus } from '../types';
import { PlanCard } from '../components/kanban/PlanCard';
import { PlanReviewModal } from '../components/kanban/PlanReviewModal';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export default function KanbanBoard() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const previousPlanIdsRef = useRef<Set<string>>(new Set());
  const notificationPermissionRef = useRef<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Request notification permission on mount
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

  const loadPlans = useCallback(async () => {
    try {
      const allPlans = await invoke<PlanItem[]>('get_all_plans');

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
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();

    // Poll for new plans every 2 seconds
    const interval = setInterval(loadPlans, 2000);
    return () => clearInterval(interval);
  }, [loadPlans]);

  const handleOpenPlan = async (plan: PlanItem) => {
    try {
      await invoke('start_review', { id: plan.id });
      setSelectedPlan({ ...plan, status: PlanStatus.InReview });
      loadPlans();
    } catch (error) {
      console.error('Failed to start review:', error);
    }
  };

  const handleClosePlan = () => {
    setSelectedPlan(null);
    loadPlans();
  };

  const handleRemovePlan = async (id: string) => {
    try {
      await invoke('remove_plan', { id });
      loadPlans();
    } catch (error) {
      console.error('Failed to remove plan:', error);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await invoke('clear_completed');
      loadPlans();
    } catch (error) {
      console.error('Failed to clear completed:', error);
    }
  };

  // Filter plans based on search query
  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const query = searchQuery.toLowerCase();
    return plans.filter(p =>
      p.project_name.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query) ||
      (p.source && p.source.toLowerCase().includes(query))
    );
  }, [plans, searchQuery]);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
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

  const pendingPlans = filteredPlans.filter(p => p.status === PlanStatus.Pending);
  const inReviewPlans = filteredPlans.filter(p => p.status === PlanStatus.InReview);
  const workingPlans = filteredPlans.filter(p => p.status === PlanStatus.ChangesRequested);
  const approvedPlans = filteredPlans.filter(p => p.status === PlanStatus.Approved);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading plans...</p>
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
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-8 py-1.5 text-sm bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-all"
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
              onClick={loadPlans}
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
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-6 overflow-x-auto">
        {plans.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <img
                src="/medusa-logo.png"
                alt="Medusa"
                className="w-16 h-16 object-contain mx-auto opacity-50"
              />
              <h2 className="text-lg font-medium text-foreground">No Plans to Review</h2>
              <p className="text-sm text-muted-foreground">
                When Claude Code enters plan mode, plans will appear here for review.
              </p>
            </div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto" />
              <h2 className="text-lg font-medium text-foreground">No matching plans</h2>
              <p className="text-sm text-muted-foreground">
                No plans match "{searchQuery}". Try a different search term.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 min-h-full">
            {/* Pending Column */}
            <div className="flex-1 min-w-[300px] max-w-[400px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-foreground">Pending</h2>
                  {pendingPlans.length > 0 && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {pendingPlans.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {pendingPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onOpen={() => handleOpenPlan(plan)}
                    onRemove={() => handleRemovePlan(plan.id)}
                  />
                ))}
                {pendingPlans.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">No pending plans</p>
                  </div>
                )}
              </div>
            </div>

            {/* In Review Column */}
            <div className="flex-1 min-w-[300px] max-w-[400px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-foreground">In Review</h2>
                  {inReviewPlans.length > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {inReviewPlans.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {inReviewPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onOpen={() => setSelectedPlan(plan)}
                    onRemove={() => handleRemovePlan(plan.id)}
                    isActive
                  />
                ))}
                {inReviewPlans.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">Click a plan to review</p>
                  </div>
                )}
              </div>
            </div>

            {/* Working Column - Claude is making changes */}
            {workingPlans.length > 0 && (
              <div className="flex-1 min-w-[300px] max-w-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-foreground">Working</h2>
                    <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">
                      {workingPlans.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {workingPlans.map(plan => (
                    <div
                      key={plan.id}
                      className="bg-card border border-amber-500/30 rounded-lg p-4 opacity-75"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                          {plan.project_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span>Claude is making changes...</span>
                      </div>
                      {plan.feedback && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {plan.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Column */}
            <div className="flex-1 min-w-[300px] max-w-[400px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-foreground">Approved</h2>
                  {approvedPlans.length > 0 && (
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                      {approvedPlans.length}
                    </span>
                  )}
                </div>
                {approvedPlans.length > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {approvedPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onRemove={() => handleRemovePlan(plan.id)}
                    isCompleted
                  />
                ))}
                {approvedPlans.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">No approved plans</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Plan Review Modal */}
      {selectedPlan && (
        <PlanReviewModal
          plan={selectedPlan}
          onClose={handleClosePlan}
          onComplete={loadPlans}
        />
      )}
    </div>
  );
}

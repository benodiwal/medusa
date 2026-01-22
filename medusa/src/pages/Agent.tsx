import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChatInterface } from "@/components/ChatInterface";
import { RightSidebar } from "@/components/RightSidebar";
import { AgentHeader } from "@/components/AgentHeader";
import { PlanReviewModal } from "@/components/kanban/PlanReviewModal";
import { PlanItem, PlanStatus } from "@/types";

const Agent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Plan review state
  const [pendingPlan, setPendingPlan] = useState<PlanItem | null>(null);
  const previousPlanIdsRef = useRef<Set<string>>(new Set());

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Load plans and detect new pending plans
  const loadPlans = useCallback(async () => {
    try {
      const allPlans = await invoke<PlanItem[]>('get_all_plans');

      // Find pending plans
      const pendingPlans = allPlans.filter(p => p.status === PlanStatus.Pending);

      // Check for new pending plans that weren't in the previous set
      for (const plan of pendingPlans) {
        if (!previousPlanIdsRef.current.has(plan.id)) {
          // New plan detected - open the modal
          setPendingPlan(plan);
          break; // Only open one at a time
        }
      }

      // Update tracked plan IDs
      previousPlanIdsRef.current = new Set(pendingPlans.map(p => p.id));
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  }, []);

  // Poll for pending plans
  useEffect(() => {
    loadPlans();
    const interval = setInterval(loadPlans, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [loadPlans]);

  // Handle plan review completion
  const handlePlanComplete = useCallback(() => {
    setPendingPlan(null);
    loadPlans(); // Refresh to update tracked IDs
  }, [loadPlans]);

  // Handle plan modal close
  const handlePlanClose = useCallback(() => {
    setPendingPlan(null);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background w-full">
      <AgentHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <ChatInterface />
        {sidebarOpen && <RightSidebar />}
      </div>

      {/* Plan Review Modal */}
      {pendingPlan && (
        <PlanReviewModal
          plan={pendingPlan}
          onClose={handlePlanClose}
          onComplete={handlePlanComplete}
        />
      )}
    </div>
  );
};

export default Agent;
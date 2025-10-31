import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AgentService } from '@/lib/services/agentService';
import { useWorkspace } from './WorkspaceContext';
import type { CreateAgentRequest, AgentResponse } from '@/lib/api/types';

interface AgentState {
  isLoading: boolean;
  isArchiving: boolean;
  error: string | null;
  agents: AgentResponse[];
  selectedAgentId: string | null;
}

interface AgentActions {
  createAgent: (taskDescription: string, model?: string) => Promise<string>;
  refreshAgents: () => Promise<void>;
  stopAgent: (agentId: string) => Promise<void>;
  archiveAgent: (agentId: string, reason?: string) => Promise<void>;
  searchAgents: (query: string) => Promise<AgentResponse[]>;
  selectAgent: (agentId: string | null) => void;
  clearError: () => void;
}

type AgentContextType = AgentState & AgentActions;

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AgentState>({
    isLoading: false,
    isArchiving: false,
    error: null,
    agents: [],
    selectedAgentId: null,
  });

  const { activeWorkspace } = useWorkspace();

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setArchiving = useCallback((archiving: boolean) => {
    setState(prev => ({ ...prev, isArchiving: archiving }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const selectAgent = useCallback((agentId: string | null) => {
    setState(prev => ({ ...prev, selectedAgentId: agentId }));
  }, []);

  const createAgent = useCallback(async (taskDescription: string, model?: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      if (!activeWorkspace) {
        throw new Error('No active workspace. Please select a workspace first.');
      }

      const request: CreateAgentRequest = {
        task_description: taskDescription,
        workspace_id: activeWorkspace.id,
        model: model || 'sonnet',
        temperature: 0.7,
      };

      const agentId = await AgentService.createAgent(request);

      // Refresh agents list to include the new agent
      await refreshAgents();

      return agentId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agent';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace, setLoading, setError]);

  const refreshAgents = useCallback(async () => {
    try {
      setLoading(true);
      const agents = await AgentService.listAgents();
      setState(prev => ({ ...prev, agents }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh agents';
      setError(errorMessage);
      console.error('Failed to refresh agents:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const stopAgent = useCallback(async (agentId: string) => {
    try {
      setLoading(true);
      setError(null);

      await AgentService.stopAgent(agentId);

      // Refresh agents to update status
      await refreshAgents();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop agent';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, refreshAgents]);

  const archiveAgent = useCallback(async (agentId: string, reason?: string) => {
    try {
      setArchiving(true);
      setError(null);

      await AgentService.archiveAgent(agentId, reason);

      // Refresh agents from backend to get updated status
      await refreshAgents();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive agent';
      setError(errorMessage);
      console.error('Archive agent error:', error);

      // Refresh on error to ensure state consistency
      await refreshAgents();
    } finally {
      setArchiving(false);
    }
  }, [setArchiving, setError, refreshAgents]);

  const searchAgents = useCallback(async (query: string): Promise<AgentResponse[]> => {
    try {
      setError(null);
      const results = await AgentService.searchAgents(query, activeWorkspace?.id);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search agents';
      setError(errorMessage);
      console.error('Search agents error:', error);
      return [];
    }
  }, [setError, activeWorkspace]);

  // Refresh agents when active workspace changes
  useEffect(() => {
    if (activeWorkspace) {
      refreshAgents();
    } else {
      setState(prev => ({ ...prev, agents: [] }));
    }
  }, [activeWorkspace, refreshAgents]);

  const value: AgentContextType = {
    ...state,
    createAgent,
    refreshAgents,
    stopAgent,
    archiveAgent,
    searchAgents,
    selectAgent,
    clearError,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): AgentContextType {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
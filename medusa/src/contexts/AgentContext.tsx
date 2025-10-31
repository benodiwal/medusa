import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AgentService } from '@/lib/services/agentService';
import { useWorkspace } from './WorkspaceContext';
import type { CreateAgentRequest, AgentResponse } from '@/lib/api/types';

interface AgentState {
  isLoading: boolean;
  isArchiving: boolean;
  isDeleting: boolean;
  error: string | null;
  agents: AgentResponse[];
  selectedAgentId: string | null;
}

interface AgentActions {
  createAgent: (taskDescription: string, model?: string) => Promise<string>;
  refreshAgents: () => Promise<void>;
  stopAgent: (agentId: string) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<boolean>;
  archiveAgent: (agentId: string, reason?: string) => Promise<boolean>;
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
    isDeleting: false,
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

  const setDeleting = useCallback((deleting: boolean) => {
    setState(prev => ({ ...prev, isDeleting: deleting }));
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

  const deleteAgent = useCallback(async (agentId: string) => {
    try {
      setDeleting(true);
      setError(null);

      // Delete the agent (this will stop and remove completely)
      await AgentService.deleteAgent(agentId);

      // Clear the selected agent if it's the one being deleted
      if (state.selectedAgentId === agentId) {
        setState(prev => ({ ...prev, selectedAgentId: null }));
      }

      // Refresh agents to remove deleted agent from list
      await refreshAgents();

      // Return success so components can handle navigation
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete agent';
      setError(errorMessage);
      console.error('Delete agent error:', error);

      // Refresh on error to ensure state consistency
      await refreshAgents();

      // Return false to indicate failure
      return false;
    } finally {
      setDeleting(false);
    }
  }, [setDeleting, setError, refreshAgents, state.selectedAgentId]);

  const archiveAgent = useCallback(async (agentId: string, reason?: string) => {
    try {
      setArchiving(true);
      setError(null);

      await AgentService.archiveAgent(agentId, reason);

      // Clear the selected agent if it's the one being archived
      if (state.selectedAgentId === agentId) {
        setState(prev => ({ ...prev, selectedAgentId: null }));
      }

      // Refresh agents from backend to get updated status
      await refreshAgents();

      // Return success so components can handle navigation
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive agent';
      setError(errorMessage);
      console.error('Archive agent error:', error);

      // Refresh on error to ensure state consistency
      await refreshAgents();

      // Return false to indicate failure
      return false;
    } finally {
      setArchiving(false);
    }
  }, [setArchiving, setError, refreshAgents, state.selectedAgentId]);

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
    deleteAgent,
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
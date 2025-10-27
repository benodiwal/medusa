import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WorkspaceService } from '@/lib/services/workspaceService';
import type { WorkspaceResponse } from '@/lib/api/types';

interface WorkspaceState {
  isLoading: boolean;
  error: string | null;
  activeWorkspace: WorkspaceResponse | null;
  workspaces: WorkspaceResponse[];
}

interface WorkspaceActions {
  createWorkspaceFromDirectory: () => Promise<void>;
  refreshActiveWorkspace: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  clearError: () => void;
}

type WorkspaceContextType = WorkspaceState & WorkspaceActions;

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>({
    isLoading: false,
    error: null,
    activeWorkspace: null,
    workspaces: [],
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const createWorkspaceFromDirectory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await WorkspaceService.createWorkspaceFromDirectoryPicker();

      // Update state with new active workspace
      setState(prev => ({
        ...prev,
        activeWorkspace: result.workspace,
        workspaces: [...prev.workspaces, result.workspace],
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace';
      setError(errorMessage);
      throw error; // Re-throw so caller can handle if needed
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const refreshActiveWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const workspace = await WorkspaceService.getActiveWorkspace();
      setState(prev => ({ ...prev, activeWorkspace: workspace }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh active workspace';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const refreshWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const workspaces = await WorkspaceService.listWorkspaces();
      setState(prev => ({ ...prev, workspaces }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh workspaces';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    try {
      setLoading(true);
      setError(null);

      await WorkspaceService.switchWorkspace(workspaceId);

      // Refresh active workspace after switching
      await refreshActiveWorkspace();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch workspace';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, refreshActiveWorkspace]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    try {
      setLoading(true);
      setError(null);

      await WorkspaceService.deleteWorkspace(workspaceId);

      // Remove from local state
      setState(prev => ({
        ...prev,
        workspaces: prev.workspaces.filter(w => w.id !== workspaceId),
        activeWorkspace: prev.activeWorkspace?.id === workspaceId ? null : prev.activeWorkspace,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workspace';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Initialize workspace data on mount
  useEffect(() => {
    refreshActiveWorkspace();
    refreshWorkspaces();
  }, [refreshActiveWorkspace, refreshWorkspaces]);

  const value: WorkspaceContextType = {
    ...state,
    createWorkspaceFromDirectory,
    refreshActiveWorkspace,
    refreshWorkspaces,
    switchWorkspace,
    deleteWorkspace,
    clearError,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
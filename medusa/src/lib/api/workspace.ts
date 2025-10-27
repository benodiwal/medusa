import { invoke } from '@tauri-apps/api/core';
import type {
  CreateWorkspaceRequest,
  WorkspaceResponse,
  ApiResult
} from './types';

export class WorkspaceAPI {
  static async createWorkspace(request: CreateWorkspaceRequest): ApiResult<string> {
    try {
      const workspaceId = await invoke<string>('create_workspace', { request });
      return workspaceId;
    } catch (error) {
      throw new Error(`Failed to create workspace: ${error}`);
    }
  }

  static async setActiveWorkspace(workspaceId: string): ApiResult<void> {
    try {
      await invoke<void>('set_active_workspace', { workspaceId });
    } catch (error) {
      throw new Error(`Failed to set active workspace: ${error}`);
    }
  }

  static async getActiveWorkspace(): ApiResult<WorkspaceResponse | null> {
    try {
      const workspace = await invoke<WorkspaceResponse | null>('get_active_workspace');
      return workspace;
    } catch (error) {
      throw new Error(`Failed to get active workspace: ${error}`);
    }
  }

  static async listWorkspaces(): ApiResult<WorkspaceResponse[]> {
    try {
      const workspaces = await invoke<WorkspaceResponse[]>('list_workspaces');
      return workspaces;
    } catch (error) {
      throw new Error(`Failed to list workspaces: ${error}`);
    }
  }

  static async deleteWorkspace(workspaceId: string): ApiResult<void> {
    try {
      await invoke<void>('delete_workspace', { workspaceId });
    } catch (error) {
      throw new Error(`Failed to delete workspace: ${error}`);
    }
  }
}
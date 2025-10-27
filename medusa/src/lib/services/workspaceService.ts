import { WorkspaceAPI } from '../api';
import { FileSystemUtils, type DirectorySelection } from '../utils/filesystem';
import type { WorkspaceResponse } from '../api/types';

export class WorkspaceService {
  /**
   * Opens directory picker and creates a new workspace
   */
  static async createWorkspaceFromDirectoryPicker(): Promise<{
    workspaceId: string;
    workspace: WorkspaceResponse;
  }> {
    // Step 1: Let user select directory
    const selection = await FileSystemUtils.selectDirectory();
    if (!selection) {
      throw new Error('No directory selected');
    }

    // Step 2: Validate the selection
    if (!FileSystemUtils.isValidRepositoryPath(selection.path)) {
      throw new Error('Invalid repository path selected');
    }

    // Step 3: Create workspace with the selected directory
    const workspaceId = await WorkspaceAPI.createWorkspace({
      name: selection.name,
      repo_path: selection.path,
      // No description or tags as requested
    });

    // Step 4: Set as active workspace
    await WorkspaceAPI.setActiveWorkspace(workspaceId);

    // Step 5: Get the created workspace details
    const workspace = await WorkspaceAPI.getActiveWorkspace();
    if (!workspace) {
      throw new Error('Failed to retrieve created workspace');
    }

    return {
      workspaceId,
      workspace,
    };
  }

  /**
   * Get the current active workspace
   */
  static async getActiveWorkspace(): Promise<WorkspaceResponse | null> {
    return await WorkspaceAPI.getActiveWorkspace();
  }

  /**
   * List all workspaces
   */
  static async listWorkspaces(): Promise<WorkspaceResponse[]> {
    return await WorkspaceAPI.listWorkspaces();
  }

  /**
   * Switch to a different workspace
   */
  static async switchWorkspace(workspaceId: string): Promise<void> {
    await WorkspaceAPI.setActiveWorkspace(workspaceId);
  }

  /**
   * Delete a workspace
   */
  static async deleteWorkspace(workspaceId: string): Promise<void> {
    await WorkspaceAPI.deleteWorkspace(workspaceId);
  }
}
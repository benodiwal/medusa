import { open } from '@tauri-apps/plugin-dialog';
import { basename } from '@tauri-apps/api/path';

export interface DirectorySelection {
  path: string;
  name: string;
}

export class FileSystemUtils {
  /**
   * Opens a directory picker dialog and returns the selected directory
   */
  static async selectDirectory(): Promise<DirectorySelection | null> {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: 'Select Repository Directory',
      });

      if (!selectedPath || Array.isArray(selectedPath)) {
        return null;
      }

      // Extract the directory name from the path
      const name = await basename(selectedPath);

      return {
        path: selectedPath,
        name,
      };
    } catch (error) {
      console.error('Failed to select directory:', error);
      throw new Error(`Failed to select directory: ${error}`);
    }
  }

  /**
   * Validates if a path looks like a repository directory
   * This is a basic check - you could extend it to check for .git folder, etc.
   */
  static isValidRepositoryPath(path: string): boolean {
    // Basic validation - just check if it's not empty
    return path.trim().length > 0;
  }

  /**
   * Extract a clean repository name from a path
   */
  static getRepositoryNameFromPath(path: string): string {
    return path.split('/').pop() || path.split('\\').pop() || 'Unnamed Repository';
  }
}
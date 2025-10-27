// Main API exports
export { WorkspaceAPI } from './workspace';
export { AgentAPI } from './agent';
export * from './types';

// Re-export for convenience - import to avoid circular reference issues
import { WorkspaceAPI } from './workspace';
import { AgentAPI } from './agent';

export const API = {
  workspace: WorkspaceAPI,
  agent: AgentAPI,
};
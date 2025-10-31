export { WorkspaceAPI } from './workspace';
export { AgentAPI } from './agent';
export * from './types';

import { WorkspaceAPI } from './workspace';
import { AgentAPI } from './agent';

export const API = {
  workspace: WorkspaceAPI,
  agent: AgentAPI,
};
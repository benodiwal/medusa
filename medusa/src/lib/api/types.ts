export interface CreateWorkspaceRequest {
  name: string;
  repo_path: string;
  description?: string;
  tags?: string[];
}

export interface CreateAgentRequest {
  task_description: string;
  model?: string;
  temperature?: number;
  workspace_id?: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  repo_path: string;
  description?: string;
  tags: string[];
  created_at: string;
  agent_count: number;
}

export interface AgentResponse {
  id: string;
  name: string;
  branch_name: string;
  container_id: string;
  task: string;
  status: string;
  created_at: string;
}

export type ApiError = string;
export type ApiResult<T> = Promise<T>;
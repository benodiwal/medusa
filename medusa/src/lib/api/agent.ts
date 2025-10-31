import { invoke } from '@tauri-apps/api/core';
import type {
  CreateAgentRequest,
  AgentResponse,
  ApiResult
} from './types';

export class AgentAPI {
  static async createAgent(request: CreateAgentRequest): ApiResult<string> {
    try {
      const agentId = await invoke<string>('create_agent', { request });
      return agentId;
    } catch (error) {
      throw new Error(`Failed to create agent: ${error}`);
    }
  }

  static async listAgents(): ApiResult<AgentResponse[]> {
    try {
      const agents = await invoke<AgentResponse[]>('list_agents');
      return agents;
    } catch (error) {
      throw new Error(`Failed to list agents: ${error}`);
    }
  }

  static async getAgent(agentId: string): ApiResult<AgentResponse | null> {
    try {
      const agent = await invoke<AgentResponse | null>('get_agent', { agentId });
      return agent;
    } catch (error) {
      throw new Error(`Failed to get agent: ${error}`);
    }
  }

  static async stopAgent(agentId: string): ApiResult<void> {
    try {
      await invoke<void>('stop_agent', { agentId });
    } catch (error) {
      throw new Error(`Failed to stop agent: ${error}`);
    }
  }

  static async archiveAgent(agentId: string, reason?: string): ApiResult<void> {
    try {
      await invoke<void>('archive_agent', { agentId, reason });
    } catch (error) {
      throw new Error(`Failed to archive agent: ${error}`);
    }
  }

  static async getAgentLogs(agentId: string): ApiResult<string> {
    try {
      const logs = await invoke<string>('get_agent_logs', { agentId });
      return logs;
    } catch (error) {
      throw new Error(`Failed to get agent logs: ${error}`);
    }
  }

  static async executeTerminalCommand(agentId: string, command: string): ApiResult<string> {
    try {
      const output = await invoke<string>('execute_terminal_command', { agentId, command });
      return output;
    } catch (error) {
      throw new Error(`Failed to execute terminal command: ${error}`);
    }
  }

  static async searchAgents(query: string, workspaceId?: string): ApiResult<AgentResponse[]> {
    try {
      const agents = await invoke<AgentResponse[]>('search_agents', {
        query,
        workspaceId: workspaceId || null
      });
      return agents;
    } catch (error) {
      throw new Error(`Failed to search agents: ${error}`);
    }
  }
}
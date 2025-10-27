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
}
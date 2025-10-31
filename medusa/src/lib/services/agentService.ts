import { AgentAPI } from '../api';
import type { CreateAgentRequest, AgentResponse } from '../api/types';

export class AgentService {
  /**
   * Create a new agent in the active workspace
   */
  static async createAgent(request: CreateAgentRequest): Promise<string> {
    return await AgentAPI.createAgent(request);
  }

  /**
   * List all agents
   */
  static async listAgents(): Promise<AgentResponse[]> {
    return await AgentAPI.listAgents();
  }

  /**
   * Get a specific agent by ID
   */
  static async getAgent(agentId: string): Promise<AgentResponse | null> {
    return await AgentAPI.getAgent(agentId);
  }

  /**
   * Stop an agent
   */
  static async stopAgent(agentId: string): Promise<void> {
    await AgentAPI.stopAgent(agentId);
  }

  /**
   * Archive an agent
   */
  static async archiveAgent(agentId: string, reason?: string): Promise<void> {
    await AgentAPI.archiveAgent(agentId, reason);
  }

  /**
   * Get logs for an agent
   */
  static async getAgentLogs(agentId: string): Promise<string> {
    return await AgentAPI.getAgentLogs(agentId);
  }

  /**
   * Execute a terminal command in an agent's container
   */
  static async executeTerminalCommand(agentId: string, command: string): Promise<string> {
    return await AgentAPI.executeTerminalCommand(agentId, command);
  }

  /**
   * Search agents by query
   */
  static async searchAgents(query: string, workspaceId?: string): Promise<AgentResponse[]> {
    return await AgentAPI.searchAgents(query, workspaceId);
  }
}
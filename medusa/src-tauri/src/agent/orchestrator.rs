use crate::agent::types::*;
use crate::agent::name_generator::{generate_agent_name, create_branch_name, create_container_name};
use crate::docker::ContainerManager;
use crate::workspace::{ArchiveReason, WorkspaceManager};
use anyhow::Result;
use std::sync::Arc;
use tracing::{info, warn, debug};

/// AgentOrchestrator handles the coordination between workspace management and container lifecycle
/// It doesn't duplicate workspace functionality but orchestrates between services
pub struct AgentOrchestrator {
    container_manager: Arc<ContainerManager>,
    workspace_manager: Arc<WorkspaceManager>,
}

impl AgentOrchestrator {
    pub fn new(
        container_manager: Arc<ContainerManager>,
        workspace_manager: Arc<WorkspaceManager>,
    ) -> Self {
        Self {
            container_manager,
            workspace_manager,
        }
    }

    /// Create agent with full lifecycle (container + workspace registration)
    pub async fn create_agent_in_workspace(
        &self,
        workspace_id: &str,
        config: AgentConfig,
    ) -> Result<AgentId> {
        let workspace = self
            .workspace_manager
            .get_workspace(workspace_id)
            .await
            .ok_or_else(|| anyhow::anyhow!("Workspace not found"))?;

        let agent_id = AgentId::new();
        let agent_name = generate_agent_name();
        let branch_name = create_branch_name(&agent_name);
        let container_name = create_container_name(&agent_name, &agent_id.0);

        info!("Creating agent '{}' ({}) in workspace {}", agent_name, agent_id.0, workspace_id);

        let container_id = self
            .container_manager
            .create_agent_container(
                &container_name,
                &branch_name,
                workspace.config.repo_path.to_str().unwrap_or(""),
            )
            .await?;

        debug!("Created container {} for agent '{}'", container_id, agent_name);

        let agent = Agent {
            id: agent_id.clone(),
            name: agent_name.clone(),
            branch_name,
            container_id,
            status: AgentStatus::Running,
            task: config.task_description,
            created_at: chrono::Utc::now(),
        };

        self.workspace_manager
            .add_agent_to_workspace(workspace_id, agent)
            .await?;

        info!("Successfully created agent {} in workspace {}", agent_id.0, workspace_id);
        Ok(agent_id)
    }

    /// Create agent in active workspace
    pub async fn create_agent(&self, config: AgentConfig) -> Result<AgentId> {
        let active_workspace = self
            .workspace_manager
            .get_active_workspace()
            .await
            .ok_or_else(|| anyhow::anyhow!("No active workspace"))?;

        self.create_agent_in_workspace(&active_workspace.id().0, config)
            .await
    }

    /// Stop agent and update status
    pub async fn stop_agent(&self, agent_id: &str) -> Result<()> {
        // Find the agent across all workspaces
        let agent = self.find_agent(agent_id).await
            .ok_or_else(|| anyhow::anyhow!("Agent not found"))?;

        info!("Stopping agent '{}' ({})", agent.agent.name, agent_id);

        // Stop container
        self.container_manager
            .stop_container(agent.container_id())
            .await?;

        debug!("Stopped container {} for agent '{}'", agent.container_id(), agent.agent.name);

        // Update agent status in workspace using the workspace manager's capability
        self.workspace_manager
            .with_workspace_mut(agent.workspace_id(), |workspace| {
                if let Some(agent) = workspace.get_agent_mut(agent_id) {
                    agent.status = AgentStatus::Stopped;
                }
                Ok(())
            })
            .await?;

        info!("Successfully stopped agent '{}' ({})", agent.agent.name, agent_id);
        Ok(())
    }

    /// Archive agent with container cleanup
    pub async fn archive_agent(&self, agent_id: &str, reason: String) -> Result<()> {
        let agent = self.find_agent(agent_id).await
            .ok_or_else(|| anyhow::anyhow!("Agent not found"))?;

        info!("Archiving agent '{}' ({}) with reason: {}", agent.agent.name, agent_id, reason);

        // Stop and remove container
        if let Err(e) = self.container_manager.stop_container(agent.container_id()).await {
            warn!("Failed to stop container {} for agent {}: {}", agent.container_id(), agent_id, e);
        }

        if let Err(e) = self.container_manager.remove_container(agent.container_id()).await {
            warn!("Failed to remove container {} for agent {}: {}", agent.container_id(), agent_id, e);
        }

        // Archive in workspace
        self.workspace_manager
            .archive_agent_in_workspace(agent.workspace_id(), agent_id, reason)
            .await?;

        info!("Successfully archived agent {}", agent_id);
        Ok(())
    }

    /// Complete cleanup - archive agent and clean up all resources
    pub async fn cleanup_agent(&self, agent_id: &str) -> Result<()> {
        self.archive_agent(agent_id, "Manual cleanup".to_string()).await
    }

    /// Get agent from any workspace
    pub async fn get_agent(&self, agent_id: &str) -> Option<crate::agent::types::Agent> {
        let workspaces = self.workspace_manager.list_workspaces().await;
        for workspace in workspaces {
            if let Some(agent) = workspace.get_agent(agent_id) {
                return Some(agent.clone());
            }
        }
        None
    }

    /// List all agents (active and archived) in active workspace
    pub async fn list_agents(&self) -> Result<Vec<crate::agent::types::Agent>> {
        let workspace = self.workspace_manager
            .get_active_workspace()
            .await
            .ok_or_else(|| anyhow::anyhow!("No active workspace"))?;

        let mut agents = Vec::new();

        // Add active agents
        agents.extend(workspace.list_active_agents().into_iter().cloned());

        // Add archived agents (extract the Agent from ArchivedAgent)
        agents.extend(
            workspace.list_archived_agents()
                .into_iter()
                .map(|archived| {
                    let mut agent = archived.agent.clone();
                    // Update status to reflect it's archived
                    agent.status = crate::agent::types::AgentStatus::Archived;
                    agent
                })
        );

        Ok(agents)
    }

    /// Get logs for an agent's container
    pub async fn get_agent_logs(&self, agent_id: &str) -> Result<String> {
        let agent = self.find_agent(agent_id).await
            .ok_or_else(|| anyhow::anyhow!("Agent not found"))?;

        info!("Fetching logs for agent '{}' ({})", agent.agent.name, agent_id);

        // Get logs from container
        let mut logs = self.container_manager
            .get_logs(agent.container_id())
            .await?;

        // Add agent context header if logs are available
        if !logs.is_empty() {
            let header = format!(
                "=== Agent: {} ({}) ===\n=== Status: {:?} ===\n=== Container: {} ===\n\n",
                agent.agent.name,
                agent_id,
                agent.agent.status,
                &agent.container_id()[..12] // Show first 12 chars of container ID
            );
            logs = format!("{}{}", header, logs);
        }

        debug!("Successfully fetched {} bytes of logs for agent '{}'", logs.len(), agent.agent.name);
        Ok(logs)
    }


    /// Cleanup entire workspace - stop all containers and archive agents
    pub async fn cleanup_workspace(&self, workspace_id: &str) -> Result<()> {
        info!("Cleaning up workspace {}", workspace_id);

        let workspace = self
            .workspace_manager
            .get_workspace(workspace_id)
            .await
            .ok_or_else(|| anyhow::anyhow!("Workspace not found"))?;

        // Stop all containers
        for agent in workspace.list_active_agents() {
            if let Err(e) = self.container_manager
                .stop_container(&agent.container_id)
                .await
            {
                warn!("Failed to stop container {} for agent {}: {}", agent.container_id, agent.id.0, e);
            }

            if let Err(e) = self.container_manager
                .remove_container(&agent.container_id)
                .await
            {
                warn!("Failed to remove container {} for agent {}: {}", agent.container_id, agent.id.0, e);
            }
        }

        // Archive all agents
        self.workspace_manager
            .with_workspace_mut(workspace_id, |workspace| {
                workspace.archive_all_agents(ArchiveReason::WorkspaceDeletion);
                Ok(())
            })
            .await?;

        info!("Successfully cleaned up workspace {}", workspace_id);
        Ok(())
    }

    // Helper method to find agent across workspaces
    async fn find_agent(&self, agent_id: &str) -> Option<AgentWithWorkspace> {
        let workspaces = self.workspace_manager.list_workspaces().await;
        for workspace in workspaces {
            if let Some(agent) = workspace.get_agent(agent_id) {
                return Some(AgentWithWorkspace {
                    agent: agent.clone(),
                    workspace_id: workspace.id().0.clone(),
                });
            }
        }
        None
    }
}

// Helper struct for internal use
struct AgentWithWorkspace {
    agent: Agent,
    workspace_id: String,
}

impl AgentWithWorkspace {
    fn container_id(&self) -> &str {
        &self.agent.container_id
    }

    fn workspace_id(&self) -> &str {
        &self.workspace_id
    }
}
use crate::agent::types::*;
use crate::docker::ContainerManager;
use crate::git::GitManager;
use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct AgentManager {
    agents: Arc<RwLock<HashMap<String, Agent>>>,
    container_manager: Arc<ContainerManager>,
    git_manager: Arc<GitManager>,
    repo_path: String,
}

impl AgentManager {
    pub fn new(repo_path: String) -> Result<Self> {
        Ok(Self {
            agents: Arc::new(RwLock::new(HashMap::new())),
            container_manager: Arc::new(ContainerManager::new()?),
            git_manager: Arc::new(GitManager::new(repo_path.clone())?),
            repo_path,
        })
    }

    /// Spawn a new agent
    pub async fn create_agent(&self, config: AgentConfig) -> Result<AgentId> {
        let agent_id = AgentId::new();
        let branch_name = format!("agent-{}", agent_id.0);

        // 1. Create Docker container
        let container_id = self
            .container_manager
            .create_agent_container(&agent_id.0, &branch_name, &self.repo_path)
            .await?;

        // 2. Create Agent record
        let agent = Agent {
            id: agent_id.clone(),
            branch_name: branch_name.clone(),
            container_id: container_id.clone(),
            status: AgentStatus::Running,
            task: config.task_description.clone(),
            created_at: chrono::Utc::now(),
        };

        // 3. Store agent
        self.agents.write().await.insert(agent_id.0.clone(), agent);

        // 4. Agent container now:
        //    - Has cloned repo
        //    - Created agent-{id} branch
        //    - Started working

        Ok(agent_id)
    }

    /// Get agent status
    pub async fn get_agent(&self, agent_id: &str) -> Option<Agent> {
        self.agents.read().await.get(agent_id).cloned()
    }

    /// List all agents
    pub async fn list_agents(&self) -> Vec<Agent> {
        self.agents.read().await.values().cloned().collect()
    }

    /// Stop agent
    pub async fn stop_agent(&self, agent_id: &str) -> Result<()> {
        let mut agents = self.agents.write().await;

        if let Some(agent) = agents.get_mut(agent_id) {
            self.container_manager
                .stop_container(&agent.container_id)
                .await?;
            agent.status = AgentStatus::Stopped;
        }

        Ok(())
    }

    /// Cleanup agent (stop + remove container)
    pub async fn cleanup_agent(&self, agent_id: &str) -> Result<()> {
        let mut agents = self.agents.write().await;

        if let Some(agent) = agents.remove(agent_id) {
            self.container_manager
                .stop_container(&agent.container_id)
                .await?;
            self.container_manager
                .remove_container(&agent.container_id)
                .await?;
        }

        Ok(())
    }
}

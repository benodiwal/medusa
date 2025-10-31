use crate::agent::types::Agent;
use crate::workspace::archive::{ArchiveManager, ArchiveReason, ArchivedAgent};
use crate::workspace::types::{WorkspaceConfig, WorkspaceId, WorkspaceMetadata};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub metadata: WorkspaceMetadata,
    pub config: WorkspaceConfig,
    agents: HashMap<String, Agent>,
    #[serde(skip)]
    archive_manager: ArchiveManager,
}

impl Workspace {
    pub fn new(config: WorkspaceConfig) -> Self {
        let id = WorkspaceId::new();
        Self {
            metadata: WorkspaceMetadata::new(id),
            config,
            agents: HashMap::new(),
            archive_manager: ArchiveManager::new(),
        }
    }

    pub fn with_id(id: WorkspaceId, config: WorkspaceConfig) -> Self {
        Self {
            metadata: WorkspaceMetadata::new(id),
            config,
            agents: HashMap::new(),
            archive_manager: ArchiveManager::new(),
        }
    }

    // Agent management
    pub fn add_agent(&mut self, agent: Agent) -> Result<()> {
        let agent_id = agent.id.0.clone();

        if self.agents.contains_key(&agent_id) {
            return Err(anyhow::anyhow!("Agent {} already exists in workspace", agent_id));
        }

        self.agents.insert(agent_id, agent);
        self.metadata.update();
        Ok(())
    }

    pub fn remove_agent(&mut self, agent_id: &str) -> Option<Agent> {
        let agent = self.agents.remove(agent_id);
        if agent.is_some() {
            self.metadata.update();
        }
        agent
    }

    pub fn get_agent(&self, agent_id: &str) -> Option<&Agent> {
        self.agents.get(agent_id)
    }

    pub fn get_agent_mut(&mut self, agent_id: &str) -> Option<&mut Agent> {
        self.metadata.update();
        self.agents.get_mut(agent_id)
    }

    pub fn update_agent(&mut self, agent: Agent) -> Result<()> {
        let agent_id = agent.id.0.clone();

        if !self.agents.contains_key(&agent_id) {
            return Err(anyhow::anyhow!("Agent {} not found in workspace", agent_id));
        }

        self.agents.insert(agent_id, agent);
        self.metadata.update();
        Ok(())
    }

    // Archive management
    pub fn archive_agent(&mut self, agent_id: &str, reason: ArchiveReason) -> Result<()> {
        let agent = self.agents.remove(agent_id)
            .ok_or_else(|| anyhow::anyhow!("Agent {} not found", agent_id))?;

        self.archive_manager.archive_agent(agent, reason);
        self.metadata.update();
        Ok(())
    }

    pub fn archive_agent_with_output(
        &mut self,
        agent_id: &str,
        reason: ArchiveReason,
        output: String,
    ) -> Result<()> {
        let agent = self.agents.remove(agent_id)
            .ok_or_else(|| anyhow::anyhow!("Agent {} not found", agent_id))?;

        self.archive_manager.archive_agent_with_details(
            agent,
            reason,
            Some(output),
            HashMap::new(),
        );
        self.metadata.update();
        Ok(())
    }

    pub fn restore_agent(&mut self, agent_id: &str) -> Result<()> {
        let agent = self.archive_manager.restore_agent(agent_id)
            .ok_or_else(|| anyhow::anyhow!("Archived agent {} not found", agent_id))?;

        if self.agents.contains_key(agent_id) {
            return Err(anyhow::anyhow!(
                "Agent {} already exists in active agents",
                agent_id
            ));
        }

        self.agents.insert(agent_id.to_string(), agent);
        self.metadata.update();
        Ok(())
    }

    pub fn get_archived_agent(&self, agent_id: &str) -> Option<&ArchivedAgent> {
        self.archive_manager.get_archived(agent_id)
    }

    pub fn delete_archived_agent(&mut self, agent_id: &str) -> Result<()> {
        self.archive_manager.remove_archived(agent_id)
            .ok_or_else(|| anyhow::anyhow!("Archived agent {} not found", agent_id))?;

        self.metadata.update();
        Ok(())
    }

    // Listing methods
    pub fn list_active_agents(&self) -> Vec<&Agent> {
        self.agents.values().collect()
    }

    pub fn list_archived_agents(&self) -> Vec<&ArchivedAgent> {
        self.archive_manager.list_archived()
    }

    pub fn list_all_agent_ids(&self) -> Vec<String> {
        let mut ids: Vec<String> = self.agents.keys().cloned().collect();
        ids.extend(
            self.archive_manager
                .list_archived()
                .iter()
                .map(|a| a.agent.id.0.clone()),
        );
        ids
    }

    // Statistics
    pub fn agent_count(&self) -> usize {
        self.agents.len()
    }

    pub fn archived_count(&self) -> usize {
        self.archive_manager.count()
    }

    pub fn total_agent_count(&self) -> usize {
        self.agent_count() + self.archived_count()
    }

    // Workspace operations
    pub fn clear_agents(&mut self) {
        self.agents.clear();
        self.metadata.update();
    }

    pub fn archive_all_agents(&mut self, reason: ArchiveReason) {
        let agent_ids: Vec<String> = self.agents.keys().cloned().collect();
        for agent_id in agent_ids {
            if let Some(agent) = self.agents.remove(&agent_id) {
                self.archive_manager.archive_agent(agent, reason.clone());
            }
        }
        self.metadata.update();
    }

    // Metadata operations
    pub fn touch(&mut self) {
        self.metadata.touch();
    }

    pub fn id(&self) -> &WorkspaceId {
        &self.metadata.id
    }

    pub fn name(&self) -> &str {
        &self.config.name
    }

    pub fn rename(&mut self, new_name: String) {
        self.config.name = new_name;
        self.metadata.update();
    }

    pub fn add_tag(&mut self, tag: String) {
        if !self.config.tags.contains(&tag) {
            self.config.tags.push(tag);
            self.metadata.update();
        }
    }

    pub fn remove_tag(&mut self, tag: &str) {
        self.config.tags.retain(|t| t != tag);
        self.metadata.update();
    }

    pub fn has_tag(&self, tag: &str) -> bool {
        self.config.tags.contains(&tag.to_string())
    }
}
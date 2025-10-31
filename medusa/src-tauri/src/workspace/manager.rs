use crate::workspace::archive::ArchiveReason;
use crate::workspace::types::{WorkspaceConfig, WorkspaceId};
use crate::workspace::workspace::Workspace;
use anyhow::Result;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct WorkspaceManager {
    workspaces: Arc<RwLock<HashMap<String, Workspace>>>,
    active_workspace: Arc<RwLock<Option<WorkspaceId>>>,
}

impl WorkspaceManager {
    pub fn new() -> Self {
        Self {
            workspaces: Arc::new(RwLock::new(HashMap::new())),
            active_workspace: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn create_workspace(&self, name: String, repo_path: PathBuf) -> Result<WorkspaceId> {
        let config = WorkspaceConfig::new(name, repo_path);
        let workspace = Workspace::new(config);
        let workspace_id = workspace.id().clone();

        let mut workspaces = self.workspaces.write().await;

        if workspaces.contains_key(&workspace_id.0) {
            return Err(anyhow::anyhow!("Workspace ID collision, please retry"));
        }

        workspaces.insert(workspace_id.0.clone(), workspace);
        Ok(workspace_id)
    }

    pub async fn create_workspace_with_config(&self, config: WorkspaceConfig) -> Result<WorkspaceId> {
        let workspace = Workspace::new(config);
        let workspace_id = workspace.id().clone();

        let mut workspaces = self.workspaces.write().await;

        if workspaces.contains_key(&workspace_id.0) {
            return Err(anyhow::anyhow!("Workspace ID collision, please retry"));
        }

        workspaces.insert(workspace_id.0.clone(), workspace);
        Ok(workspace_id)
    }

    pub async fn delete_workspace(&self, workspace_id: &str) -> Result<()> {
        let mut workspaces = self.workspaces.write().await;

        // Archive all agents before deletion
        if let Some(workspace) = workspaces.get_mut(workspace_id) {
            workspace.archive_all_agents(ArchiveReason::WorkspaceDeletion);
        }

        if workspaces.remove(workspace_id).is_none() {
            return Err(anyhow::anyhow!("Workspace not found"));
        }

        // Clear active workspace if it was the deleted one
        let mut active = self.active_workspace.write().await;
        if let Some(active_id) = active.as_ref() {
            if active_id.0 == workspace_id {
                *active = None;
            }
        }

        Ok(())
    }

    pub async fn get_workspace(&self, workspace_id: &str) -> Option<Workspace> {
        let mut workspaces = self.workspaces.write().await;
        if let Some(workspace) = workspaces.get_mut(workspace_id) {
            workspace.touch();
            Some(workspace.clone())
        } else {
            None
        }
    }

    pub async fn get_workspace_by_name(&self, name: &str) -> Option<Workspace> {
        let mut workspaces = self.workspaces.write().await;
        for workspace in workspaces.values_mut() {
            if workspace.name() == name {
                workspace.touch();
                return Some(workspace.clone());
            }
        }
        None
    }

    pub async fn workspace_exists(&self, workspace_id: &str) -> bool {
        self.workspaces.read().await.contains_key(workspace_id)
    }

    pub async fn set_active_workspace(&self, workspace_id: WorkspaceId) -> Result<()> {
        if !self.workspace_exists(&workspace_id.0).await {
            return Err(anyhow::anyhow!("Workspace not found"));
        }

        let mut active = self.active_workspace.write().await;
        *active = Some(workspace_id);
        Ok(())
    }

    pub async fn get_active_workspace_id(&self) -> Option<WorkspaceId> {
        self.active_workspace.read().await.clone()
    }

    pub async fn get_active_workspace(&self) -> Option<Workspace> {
        let active_id = self.get_active_workspace_id().await?;
        self.get_workspace(&active_id.0).await
    }

    pub async fn clear_active_workspace(&self) {
        let mut active = self.active_workspace.write().await;
        *active = None;
    }

    pub async fn list_workspaces(&self) -> Vec<Workspace> {
        self.workspaces.read().await.values().cloned().collect()
    }

    pub async fn list_workspace_names(&self) -> Vec<(String, String)> {
        self.workspaces
            .read()
            .await
            .values()
            .map(|w| (w.id().0.clone(), w.name().to_string()))
            .collect()
    }

    pub async fn find_workspaces_by_tag(&self, tag: &str) -> Vec<Workspace> {
        self.workspaces
            .read()
            .await
            .values()
            .filter(|w| w.has_tag(tag))
            .cloned()
            .collect()
    }

    pub async fn workspace_count(&self) -> usize {
        self.workspaces.read().await.len()
    }

    pub async fn total_agent_count(&self) -> usize {
        self.workspaces
            .read()
            .await
            .values()
            .map(|w| w.total_agent_count())
            .sum()
    }

    pub async fn active_agent_count(&self) -> usize {
        self.workspaces
            .read()
            .await
            .values()
            .map(|w| w.agent_count())
            .sum()
    }

    pub async fn with_workspace_mut<F, R>(&self, workspace_id: &str, f: F) -> Result<R>
    where
        F: FnOnce(&mut Workspace) -> Result<R>,
    {
        let mut workspaces = self.workspaces.write().await;
        let workspace = workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| anyhow::anyhow!("Workspace not found"))?;

        workspace.touch();
        f(workspace)
    }

    pub async fn with_active_workspace_mut<F, R>(&self, f: F) -> Result<R>
    where
        F: FnOnce(&mut Workspace) -> Result<R>,
    {
        let active_id = self
            .get_active_workspace_id()
            .await
            .ok_or_else(|| anyhow::anyhow!("No active workspace"))?;

        self.with_workspace_mut(&active_id.0, f).await
    }

    // Agent-specific operations for compatibility
    pub async fn add_agent_to_workspace(
        &self,
        workspace_id: &str,
        agent: crate::agent::types::Agent,
    ) -> Result<()> {
        self.with_workspace_mut(workspace_id, |workspace| workspace.add_agent(agent))
            .await
    }

    pub async fn archive_agent_in_workspace(
        &self,
        workspace_id: &str,
        agent_id: &str,
        reason: String,
    ) -> Result<()> {
        self.with_workspace_mut(workspace_id, |workspace| {
            workspace.archive_agent(agent_id, ArchiveReason::UserRequested(reason))
        })
        .await
    }

    pub async fn restore_agent_in_workspace(
        &self,
        workspace_id: &str,
        agent_id: &str,
    ) -> Result<()> {
        self.with_workspace_mut(workspace_id, |workspace| workspace.restore_agent(agent_id))
            .await
    }

    pub async fn delete_archived_agent_in_workspace(
        &self,
        workspace_id: &str,
        agent_id: &str,
    ) -> Result<()> {
        self.with_workspace_mut(workspace_id, |workspace| workspace.delete_archived_agent(agent_id))
            .await
    }
}

impl Default for WorkspaceManager {
    fn default() -> Self {
        Self::new()
    }
}
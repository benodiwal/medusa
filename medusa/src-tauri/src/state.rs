use std::sync::Arc;

use crate::agent::AgentOrchestrator;
use crate::docker::ContainerManager;
use crate::workspace::WorkspaceManager;
use anyhow::Result;

pub struct AppState {
    pub workspace_manager: Arc<WorkspaceManager>,
    pub container_manager: Arc<ContainerManager>,
    pub agent_orchestrator: Arc<AgentOrchestrator>,
}

impl AppState {
    pub fn new() -> Result<Self> {
        let workspace_manager = Arc::new(WorkspaceManager::new());
        let container_manager = Arc::new(ContainerManager::new()?);
        let agent_orchestrator = Arc::new(AgentOrchestrator::new(
            container_manager.clone(),
            workspace_manager.clone(),
        ));

        Ok(Self {
            workspace_manager,
            container_manager,
            agent_orchestrator,
        })
    }
}
use std::sync::Arc;

use crate::agent::AgentManager;
use anyhow::Result;

pub struct AppState {
    pub agent_manager: Arc<AgentManager>,
}

impl AppState {
    pub fn new(repo_path: String) -> Result<Self> {
        Ok(Self {
            agent_manager: Arc::new(AgentManager::new(repo_path)?)
        })
    }
}

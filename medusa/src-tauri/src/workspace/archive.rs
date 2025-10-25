use crate::agent::types::Agent;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ArchiveReason {
    Completed,
    Failed(String),
    UserRequested(String),
    Timeout,
    ResourceCleanup,
    WorkspaceDeletion,
}

impl ArchiveReason {
    pub fn to_string(&self) -> String {
        match self {
            Self::Completed => "Task completed successfully".to_string(),
            Self::Failed(msg) => format!("Failed: {}", msg),
            Self::UserRequested(reason) => format!("User requested: {}", reason),
            Self::Timeout => "Agent timeout".to_string(),
            Self::ResourceCleanup => "Resource cleanup".to_string(),
            Self::WorkspaceDeletion => "Workspace deletion".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchivedAgent {
    pub agent: Agent,
    pub archived_at: DateTime<Utc>,
    pub archive_reason: ArchiveReason,
    pub final_output: Option<String>,
    pub metadata: HashMap<String, String>,
}

impl ArchivedAgent {
    pub fn new(agent: Agent, reason: ArchiveReason) -> Self {
        Self {
            agent,
            archived_at: Utc::now(),
            archive_reason: reason,
            final_output: None,
            metadata: HashMap::new(),
        }
    }

    pub fn with_output(mut self, output: String) -> Self {
        self.final_output = Some(output);
        self
    }

    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }

    pub fn add_metadata(&mut self, key: String, value: String) {
        self.metadata.insert(key, value);
    }
}

#[derive(Debug, Clone, Default)]
pub struct ArchiveManager {
    archives: HashMap<String, ArchivedAgent>,
}

impl ArchiveManager {
    pub fn new() -> Self {
        Self {
            archives: HashMap::new(),
        }
    }

    pub fn archive_agent(&mut self, agent: Agent, reason: ArchiveReason) -> String {
        let agent_id = agent.id.0.clone();
        let archived = ArchivedAgent::new(agent, reason);
        self.archives.insert(agent_id.clone(), archived);
        agent_id
    }

    pub fn archive_agent_with_details(
        &mut self,
        agent: Agent,
        reason: ArchiveReason,
        output: Option<String>,
        metadata: HashMap<String, String>,
    ) -> String {
        let agent_id = agent.id.0.clone();
        let mut archived = ArchivedAgent::new(agent, reason);

        if let Some(output) = output {
            archived.final_output = Some(output);
        }

        archived.metadata = metadata;
        self.archives.insert(agent_id.clone(), archived);
        agent_id
    }

    pub fn get_archived(&self, agent_id: &str) -> Option<&ArchivedAgent> {
        self.archives.get(agent_id)
    }

    pub fn restore_agent(&mut self, agent_id: &str) -> Option<Agent> {
        self.archives.remove(agent_id).map(|archived| archived.agent)
    }

    pub fn list_archived(&self) -> Vec<&ArchivedAgent> {
        self.archives.values().collect()
    }

    pub fn list_archived_by_reason(&self, reason_filter: &ArchiveReason) -> Vec<&ArchivedAgent> {
        self.archives
            .values()
            .filter(|archived| {
                matches!(
                    (&archived.archive_reason, reason_filter),
                    (ArchiveReason::Completed, ArchiveReason::Completed)
                        | (ArchiveReason::Timeout, ArchiveReason::Timeout)
                        | (ArchiveReason::ResourceCleanup, ArchiveReason::ResourceCleanup)
                        | (ArchiveReason::WorkspaceDeletion, ArchiveReason::WorkspaceDeletion)
                        | (ArchiveReason::Failed(_), ArchiveReason::Failed(_))
                        | (ArchiveReason::UserRequested(_), ArchiveReason::UserRequested(_))
                )
            })
            .collect()
    }

    pub fn clear_old_archives(&mut self, older_than: DateTime<Utc>) {
        self.archives.retain(|_, archived| archived.archived_at > older_than);
    }

    pub fn count(&self) -> usize {
        self.archives.len()
    }
}
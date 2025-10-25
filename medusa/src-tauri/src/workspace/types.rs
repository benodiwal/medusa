use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct WorkspaceId(pub String);

impl WorkspaceId {
    pub fn new() -> Self {
        WorkspaceId(Uuid::new_v4().to_string())
    }
}

impl Default for WorkspaceId {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub name: String,
    pub repo_path: PathBuf,
    pub description: Option<String>,
    pub tags: Vec<String>,
}

impl WorkspaceConfig {
    pub fn new(name: String, repo_path: PathBuf) -> Self {
        Self {
            name,
            repo_path,
            description: None,
            tags: Vec::new(),
        }
    }

    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceMetadata {
    pub id: WorkspaceId,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}

impl WorkspaceMetadata {
    pub fn new(id: WorkspaceId) -> Self {
        let now = Utc::now();
        Self {
            id,
            created_at: now,
            updated_at: now,
            last_accessed: now,
        }
    }

    pub fn touch(&mut self) {
        self.last_accessed = Utc::now();
        self.updated_at = Utc::now();
    }

    pub fn update(&mut self) {
        self.updated_at = Utc::now();
    }
}
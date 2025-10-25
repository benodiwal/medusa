pub mod archive;
pub mod manager;
pub mod types;
pub mod workspace;

// Re-export commonly used types for convenience
pub use archive::{ArchiveReason, ArchivedAgent};
pub use manager::WorkspaceManager;
pub use types::{WorkspaceConfig, WorkspaceId, WorkspaceMetadata};
pub use workspace::Workspace;
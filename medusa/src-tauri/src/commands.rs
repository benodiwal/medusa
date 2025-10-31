use crate::agent::orchestrator::AgentOrchestrator;
use crate::agent::types::AgentConfig;
use crate::docker::ContainerManager;
use crate::workspace::types::{WorkspaceConfig, WorkspaceId};
use crate::workspace::WorkspaceManager;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, State, Window};
use tracing::{error, info};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateWorkspaceRequest {
    pub name: String,
    pub repo_path: String,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAgentRequest {
    pub task_description: String,
    pub model: Option<String>,
    pub temperature: Option<f32>,
    pub workspace_id: Option<String>, // If None, uses active workspace
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceResponse {
    pub id: String,
    pub name: String,
    pub repo_path: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub created_at: String,
    pub agent_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentResponse {
    pub id: String,
    pub name: String,
    pub branch_name: String,
    pub container_id: String,
    pub task: String,
    pub status: String,
    pub created_at: String,
}

// Workspace Commands

#[tauri::command]
pub async fn create_workspace(
    request: CreateWorkspaceRequest,
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<String, String> {
    info!("Creating workspace: {}", request.name);

    let repo_path = PathBuf::from(&request.repo_path);

    if !repo_path.exists() {
        return Err(format!("Repository path does not exist: {}", request.repo_path));
    }

    let mut config = WorkspaceConfig::new(request.name.clone(), repo_path);

    if let Some(description) = request.description {
        config = config.with_description(description);
    }

    if let Some(tags) = request.tags {
        config = config.with_tags(tags);
    }

    match workspace_manager.create_workspace_with_config(config).await {
        Ok(workspace_id) => {
            info!("Successfully created workspace '{}' with ID: {}", request.name, workspace_id.0);
            Ok(workspace_id.0)
        }
        Err(e) => {
            error!("Failed to create workspace '{}': {}", request.name, e);
            Err(format!("Failed to create workspace: {}", e))
        }
    }
}

#[tauri::command]
pub async fn set_active_workspace(
    workspace_id: String,
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<(), String> {
    info!("Setting active workspace: {}", workspace_id);

    let id = WorkspaceId(workspace_id.clone());

    match workspace_manager.set_active_workspace(id).await {
        Ok(()) => {
            info!("Successfully set active workspace: {}", workspace_id);
            Ok(())
        }
        Err(e) => {
            error!("Failed to set active workspace '{}': {}", workspace_id, e);
            Err(format!("Failed to set active workspace: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_active_workspace(
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<Option<WorkspaceResponse>, String> {
    match workspace_manager.get_active_workspace().await {
        Some(workspace) => {
            let response = WorkspaceResponse {
                id: workspace.id().0.clone(),
                name: workspace.name().to_string(),
                repo_path: workspace.config.repo_path.to_string_lossy().to_string(),
                description: workspace.config.description.clone(),
                tags: workspace.config.tags.clone(),
                created_at: workspace.metadata.created_at.to_rfc3339(),
                agent_count: workspace.agent_count(),
            };
            Ok(Some(response))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn list_workspaces(
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<Vec<WorkspaceResponse>, String> {
    let workspaces = workspace_manager.list_workspaces().await;

    let responses = workspaces
        .into_iter()
        .map(|workspace| WorkspaceResponse {
            id: workspace.id().0.clone(),
            name: workspace.name().to_string(),
            repo_path: workspace.config.repo_path.to_string_lossy().to_string(),
            description: workspace.config.description.clone(),
            tags: workspace.config.tags.clone(),
            created_at: workspace.metadata.created_at.to_rfc3339(),
            agent_count: workspace.agent_count(),
        })
        .collect();

    Ok(responses)
}

#[tauri::command]
pub async fn delete_workspace(
    workspace_id: String,
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<(), String> {
    info!("Deleting workspace: {}", workspace_id);

    match workspace_manager.delete_workspace(&workspace_id).await {
        Ok(()) => {
            info!("Successfully deleted workspace: {}", workspace_id);
            Ok(())
        }
        Err(e) => {
            error!("Failed to delete workspace '{}': {}", workspace_id, e);
            Err(format!("Failed to delete workspace: {}", e))
        }
    }
}

// Agent Commands
#[tauri::command]
pub async fn create_agent(
    request: CreateAgentRequest,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<String, String> {
    info!("Creating agent with task: {}", request.task_description);

    let config = AgentConfig {
        model: request.model.unwrap_or_else(|| "Claude 4.5 Sonnet".to_string()),
        temperature: request.temperature.unwrap_or(0.7),
        task_description: request.task_description.clone(),
    };

    let result = if let Some(workspace_id) = request.workspace_id {
        agent_orchestrator.create_agent_in_workspace(&workspace_id, config).await
    } else {
        agent_orchestrator.create_agent(config).await
    };

    match result {
        Ok(agent_id) => {
            info!("Successfully created agent: {}", agent_id.0);
            Ok(agent_id.0)
        }
        Err(e) => {
            error!("Failed to create agent: {}", e);
            Err(format!("Failed to create agent: {}", e))
        }
    }
}

#[tauri::command]
pub async fn list_agents(
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<Vec<AgentResponse>, String> {
    match agent_orchestrator.list_agents().await {
        Ok(agents) => {
            let responses = agents
                .into_iter()
                .map(|agent| AgentResponse {
                    id: agent.id.0,
                    name: agent.name,
                    branch_name: agent.branch_name,
                    container_id: agent.container_id,
                    task: agent.task,
                    status: format!("{:?}", agent.status),
                    created_at: agent.created_at.to_rfc3339(),
                })
                .collect();
            Ok(responses)
        }
        Err(e) => {
            error!("Failed to list agents: {}", e);
            Err(format!("Failed to list agents: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_agent(
    agent_id: String,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<Option<AgentResponse>, String> {
    match agent_orchestrator.get_agent(&agent_id).await {
        Some(agent) => {
            let response = AgentResponse {
                id: agent.id.0,
                name: agent.name,
                branch_name: agent.branch_name,
                container_id: agent.container_id,
                task: agent.task,
                status: format!("{:?}", agent.status),
                created_at: agent.created_at.to_rfc3339(),
            };
            Ok(Some(response))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn stop_agent(
    agent_id: String,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    info!("Stopping agent: {}", agent_id);

    match agent_orchestrator.stop_agent(&agent_id).await {
        Ok(()) => {
            info!("Successfully stopped agent: {}", agent_id);
            Ok(())
        }
        Err(e) => {
            error!("Failed to stop agent '{}': {}", agent_id, e);
            Err(format!("Failed to stop agent: {}", e))
        }
    }
}

#[tauri::command]
pub async fn archive_agent(
    agent_id: String,
    reason: Option<String>,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    let archive_reason = reason.unwrap_or_else(|| "User archived".to_string());
    info!("Archiving agent '{}' with reason: {}", agent_id, archive_reason);

    match agent_orchestrator.archive_agent(&agent_id, archive_reason).await {
        Ok(()) => {
            info!("Successfully archived agent: {}", agent_id);
            Ok(())
        }
        Err(e) => {
            error!("Failed to archive agent '{}': {}", agent_id, e);
            Err(format!("Failed to archive agent: {}", e))
        }
    }
}

#[tauri::command]
pub async fn delete_agent(
    agent_id: String,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    info!("Deleting agent: {}", agent_id);

    match agent_orchestrator.delete_agent(&agent_id).await {
        Ok(()) => {
            info!("Successfully deleted agent: {}", agent_id);
            Ok(())
        }
        Err(e) => {
            error!("Failed to delete agent '{}': {}", agent_id, e);
            Err(format!("Failed to delete agent: {}", e))
        }
    }
}

#[tauri::command]
pub async fn delete_archived_agent(
    agent_id: String,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    info!("Deleting archived agent: {}", agent_id);

    match agent_orchestrator.delete_archived_agent(&agent_id).await {
        Ok(()) => {
            info!("Successfully deleted archived agent: {}", agent_id);
            Ok(())
        }
        Err(e) => {
            error!("Failed to delete archived agent '{}': {}", agent_id, e);
            Err(format!("Failed to delete archived agent: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_agent_logs(
    agent_id: String,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<String, String> {
    info!("Fetching logs for agent: {}", agent_id);

    match agent_orchestrator.get_agent_logs(&agent_id).await {
        Ok(logs) => {
            info!("Successfully fetched logs for agent: {}", agent_id);
            Ok(logs)
        }
        Err(e) => {
            error!("Failed to fetch logs for agent '{}': {}", agent_id, e);
            Err(format!("Failed to fetch agent logs: {}", e))
        }
    }
}

#[tauri::command]
pub async fn execute_terminal_command(
    agent_id: String,
    command: String,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<String, String> {
    info!("Executing terminal command for agent {}: {}", agent_id, command);

    match agent_orchestrator.execute_terminal_command(&agent_id, &command).await {
        Ok(output) => {
            info!("Successfully executed terminal command for agent: {}", agent_id);
            Ok(output)
        }
        Err(e) => {
            error!("Failed to execute terminal command for agent '{}': {}", agent_id, e);
            Err(format!("Failed to execute command: {}", e))
        }
    }
}

#[tauri::command]
pub async fn search_agents(
    query: String,
    workspace_id: Option<String>,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<Vec<AgentResponse>, String> {
    info!("Searching agents with query: '{}'", query);

    let result = if let Some(workspace_id) = workspace_id {
        agent_orchestrator.search_agents_in_workspace(&workspace_id, &query).await
    } else {
        agent_orchestrator.search_agents(&query).await
    };

    match result {
        Ok(agents) => {
            let responses: Vec<AgentResponse> = agents
                .into_iter()
                .map(|agent| AgentResponse {
                    id: agent.id.0,
                    name: agent.name,
                    branch_name: agent.branch_name,
                    container_id: agent.container_id,
                    task: agent.task,
                    status: format!("{:?}", agent.status),
                    created_at: agent.created_at.to_rfc3339(),
                })
                .collect();
            info!("Found {} agents matching query '{}'", responses.len(), query);
            Ok(responses)
        }
        Err(e) => {
            error!("Failed to search agents: {}", e);
            Err(format!("Failed to search agents: {}", e))
        }
    }
}

#[tauri::command]
pub async fn open_terminal(
    agent_id: String,
    container_manager: State<'_, Arc<ContainerManager>>,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    info!("Opening terminal for agent: {}", agent_id);

    // Get the agent to find its container
    let agent = agent_orchestrator.get_agent(&agent_id).await
        .ok_or_else(|| "Agent not found".to_string())?;

    // Create PTY session
    match container_manager
        .get_or_create_pty_session(&agent.container_id)
        .await
    {
        Ok(_) => {
            info!("Successfully opened terminal for agent: {}", agent_id);
            Ok(())
        }
        Err(e) => {
            error!("Failed to open terminal for agent '{}': {}", agent_id, e);
            Err(format!("Failed to open terminal: {}", e))
        }
    }
}

#[tauri::command]
pub async fn close_terminal(
    agent_id: String,
    container_manager: State<'_, Arc<ContainerManager>>,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    info!("Closing terminal for agent: {}", agent_id);

    let agent = agent_orchestrator.get_agent(&agent_id).await
        .ok_or_else(|| "Agent not found".to_string())?;

    container_manager.close_pty_session(&agent.container_id).await;
    
    info!("Successfully closed terminal for agent: {}", agent_id);
    Ok(())
}

#[tauri::command]
pub async fn send_terminal_input(
    agent_id: String,
    data: Vec<u8>,
    container_manager: State<'_, Arc<ContainerManager>>,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    let agent = agent_orchestrator.get_agent(&agent_id).await
        .ok_or_else(|| "Agent not found".to_string())?;

    match container_manager
        .send_to_pty(&agent.container_id, &data)
        .await
    {
        Ok(()) => Ok(()),
        Err(e) => {
            error!("Failed to send input to terminal for agent '{}': {}", agent_id, e);
            Err(format!("Failed to send input: {}", e))
        }
    }
}

#[tauri::command]
pub async fn recv_terminal_output(
    agent_id: String,
    container_manager: State<'_, Arc<ContainerManager>>,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<Option<Vec<u8>>, String> {
    let agent = agent_orchestrator.get_agent(&agent_id).await
        .ok_or_else(|| "Agent not found".to_string())?;

    // Use non-blocking receive
    let output = container_manager
        .try_recv_from_pty(&agent.container_id)
        .await;

    Ok(output)
}

#[tauri::command]
pub async fn resize_terminal(
    agent_id: String,
    rows: u16,
    cols: u16,
    container_manager: State<'_, Arc<ContainerManager>>,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    info!("Resizing terminal for agent {} to {}x{}", agent_id, rows, cols);

    let agent = agent_orchestrator.get_agent(&agent_id).await
        .ok_or_else(|| "Agent not found".to_string())?;

    match container_manager
        .resize_pty(&agent.container_id, rows, cols)
        .await
    {
        Ok(()) => Ok(()),
        Err(e) => {
            error!("Failed to resize terminal for agent '{}': {}", agent_id, e);
            Err(format!("Failed to resize terminal: {}", e))
        }
    }
}

// Stream terminal output using Tauri events (better for real-time)
#[tauri::command]
pub async fn start_terminal_stream(
    agent_id: String,
    window: Window,
    container_manager: State<'_, Arc<ContainerManager>>,
    agent_orchestrator: State<'_, Arc<AgentOrchestrator>>,
) -> Result<(), String> {
    info!("Starting terminal stream for agent: {}", agent_id);

    let agent = agent_orchestrator.get_agent(&agent_id).await
        .ok_or_else(|| "Agent not found".to_string())?;

    let container_id = agent.container_id.clone();
    let agent_id_clone = agent_id.clone();
    let container_manager_clone = container_manager.inner().clone();

    // Spawn a task to continuously stream output
    tokio::spawn(async move {
        loop {
            if let Some(output) = container_manager_clone
                .recv_from_pty(&container_id)
                .await
            {
                // Emit event to frontend
                let _ = window.emit(
                    &format!("terminal-output-{}", agent_id_clone),
                    output,
                );
            } else {
                // Session closed
                break;
            }
        }
    });

    Ok(())
}
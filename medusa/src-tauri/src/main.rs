// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use medusa_lib::agent::types::AgentConfig;
use medusa_lib::{log_info, log_error, log_warn};
use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    medusa_lib::logging::init_logging();

    log_info!("Starting Medusa system tests");

    // medusa_lib::run();
    Ok(())
}

async fn test_git_manager(
    _app_state: &medusa_lib::AppState,
) -> Result<(), Box<dyn std::error::Error>> {
    // Since GitManager fields are private, we'll test through a direct GitManager instance
    // For now, let's create a separate GitManager for testing
    use medusa_lib::git::GitManager;
    let git_manager = GitManager::new("/Users/sachin/personal/churnguard".to_string())?;

    // Test current branch
    match git_manager.current_branch() {
        Ok(branch) => log_info!("Current branch: {}", branch),
        Err(e) => {
            log_error!("Failed to get current branch: {}", e);
            return Err(e.into());
        }
    }

    // Test branch creation
    let test_branch = "test-medusa-branch";
    match git_manager.create_branch(test_branch) {
        Ok(_) => log_info!("Created test branch: {}", test_branch),
        Err(e) => {
            log_warn!("  Branch creation failed (may already exist): {}", e);
        }
    }

    // Test checkout
    match git_manager.checkout(test_branch) {
        Ok(_) => {
            log_info!(" Checked out to test branch");
            // Switch back to main
            let _ = git_manager.checkout("main");
        }
        Err(e) => {
            log_warn!("  Branch checkout failed: {}", e);
        }
    }

    // Cleanup: delete test branch
    match git_manager.delete_branch(test_branch) {
        Ok(_) => log_info!(" Cleaned up test branch"),
        Err(e) => log_warn!("  Failed to cleanup test branch: {}", e),
    }

    Ok(())
}

async fn test_container_manager(
    _app_state: &medusa_lib::AppState,
) -> Result<(), Box<dyn std::error::Error>> {
    // Since ContainerManager fields are private, we'll create a separate one for testing
    use medusa_lib::docker::ContainerManager;
    let container_manager = ContainerManager::new()?;

    // Test Docker connection
    println!("  🐳 Testing Docker connection...");

    // Try to create a simple test container
    let test_container_result = container_manager
        .create_agent_container(
            "test-agent",
            "test-branch",
            "/tmp", // Use a safe test path
        )
        .await;

    match test_container_result {
        Ok(container_id) => {
            println!(
                "  ✅ Docker connection successful, container created: {}",
                container_id
            );

            // Test container status
            match container_manager.container_status(&container_id).await {
                Ok(status) => log_info!(" Container status: {}", status),
                Err(e) => log_warn!("  Failed to get container status: {}", e),
            }

            // Cleanup: stop and remove container
            let _ = container_manager.stop_container(&container_id).await;
            let _ = container_manager.remove_container(&container_id).await;
            log_info!(" Test container cleaned up");
        }
        Err(e) => {
            log_warn!("  Docker test failed (may need Docker image): {}", e);
            log_info!(" Note: This is expected if 'medusa-agent:latest' image doesn't exist");
        }
    }

    Ok(())
}

async fn test_agent_manager(
    app_state: &medusa_lib::AppState,
) -> Result<(), Box<dyn std::error::Error>> {
    let agent_orchestrator = &app_state.agent_orchestrator;
    let workspace_manager = &app_state.workspace_manager;

    // First create a workspace
    log_info!(" Creating test workspace...");
    let workspace_id = workspace_manager
        .create_workspace(
            "test-workspace".to_string(),
            std::path::PathBuf::from("/Users/sachin/personal/churnguard"),
        )
        .await?;
    log_info!(" Workspace created: {}", workspace_id.0);

    // Set it as active
    workspace_manager.set_active_workspace(workspace_id.clone()).await?;
    log_info!(" Workspace set as active");

    // Test agent creation
    log_info!(" Testing agent creation...");

    let config = AgentConfig {
        model: "test-model".to_string(),
        temperature: 0.7,
        task_description: "Test task for system validation".to_string(),
    };

    let agent_result = agent_orchestrator.create_agent(config).await;

    match agent_result {
        Ok(agent_id) => {
            log_info!(" Agent created successfully: {}", agent_id.0);

            // Test agent retrieval
            if let Some(agent) = agent_orchestrator.get_agent(&agent_id.0).await {
                println!(
                    "  ✅ Agent retrieved: {} (status: {:?})",
                    agent.id.0, agent.status
                );
            } else {
                log_error!(" Failed to retrieve created agent");
            }

            // Test agent listing
            let agents = agent_orchestrator.list_agents().await?;
            log_info!(" Found {} agents in system", agents.len());

            // Wait a moment to let container start
            sleep(Duration::from_secs(2)).await;

            // Test agent stopping
            match agent_orchestrator.stop_agent(&agent_id.0).await {
                Ok(_) => log_info!(" Agent stopped successfully"),
                Err(e) => log_warn!("  Failed to stop agent: {}", e),
            }

            // Cleanup agent
            match agent_orchestrator.cleanup_agent(&agent_id.0).await {
                Ok(_) => log_info!(" Agent cleaned up successfully"),
                Err(e) => log_warn!("  Failed to cleanup agent: {}", e),
            }
        }
        Err(e) => {
            println!(
                "  ⚠️  Agent creation failed (expected without Docker image): {}",
                e
            );
            log_info!(" Note: This is expected if Docker/containers aren't available");
        }
    }

    Ok(())
}

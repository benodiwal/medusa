// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod workspace;
pub mod agent;
pub mod commands;
pub mod docker;
pub mod git;
pub mod db; // SQLite
pub mod state;
pub mod logging;

pub use state::AppState;

use db::{config::DatabaseConfig, migrations};
use tauri::Manager;
use std::sync::Arc;

// Import our command modules
use commands::{
    create_workspace, set_active_workspace, get_active_workspace, list_workspaces, delete_workspace,
    create_agent, list_agents, get_agent, stop_agent, archive_agent, get_agent_logs, execute_terminal_command, search_agents
};
use agent::orchestrator::AgentOrchestrator;
use workspace::WorkspaceManager;
use docker::ContainerManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    logging::init_logging();

    tracing::info!("Starting Medusa application");

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().add_migrations(&DatabaseConfig::default().url, migrations::all()).build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Workspace commands
            create_workspace,
            set_active_workspace,
            get_active_workspace,
            list_workspaces,
            delete_workspace,
            // Agent commands
            create_agent,
            list_agents,
            get_agent,
            stop_agent,
            archive_agent,
            get_agent_logs,
            execute_terminal_command,
            search_agents
        ])
        .setup(|app| {
            // Initialize managers and orchestrator
            let container_manager = Arc::new(
                ContainerManager::new()
                    .map_err(|e| format!("Failed to initialize ContainerManager: {}", e))?
            );
            let workspace_manager = Arc::new(WorkspaceManager::new());
            let agent_orchestrator = Arc::new(AgentOrchestrator::new(
                container_manager.clone(),
                workspace_manager.clone(),
            ));

            // Register state
            app.manage(container_manager);
            app.manage(workspace_manager);
            app.manage(agent_orchestrator);

            let window = app.get_webview_window("main").unwrap();
            window.maximize().unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

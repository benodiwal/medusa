pub mod agent;
pub mod commands;
pub mod db; // SQLite
pub mod docker;
pub mod git;
pub mod logging;
pub mod state;
pub mod workspace;

pub use state::AppState;

use db::{config::DatabaseConfig, migrations};
use std::sync::Arc;
use tauri::Manager;

use agent::orchestrator::AgentOrchestrator;
use commands::{
    archive_agent, create_agent, create_workspace, delete_agent, delete_archived_agent,
    delete_workspace, execute_terminal_command, get_active_workspace, get_agent, get_agent_logs,
    list_agents, list_workspaces, search_agents, set_active_workspace, stop_agent,
};
use docker::ContainerManager;
use workspace::WorkspaceManager;

use crate::commands::{close_terminal, open_terminal, resize_terminal, send_terminal_input, start_terminal_stream};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    logging::init_logging();

    tracing::info!("Starting Medusa application");

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(&DatabaseConfig::default().url, migrations::all())
                .build(),
        )
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
            delete_agent,
            delete_archived_agent,
            archive_agent,
            get_agent_logs,
            execute_terminal_command,
            search_agents,
            // Agent PTY
            open_terminal,
            close_terminal,
            send_terminal_input,
            resize_terminal,
            start_terminal_stream,
        ])
        .setup(|app| {
            // Initialize managers and orchestrator
            let container_manager = Arc::new(
                ContainerManager::new()
                    .map_err(|e| format!("Failed to initialize ContainerManager: {}", e))?,
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

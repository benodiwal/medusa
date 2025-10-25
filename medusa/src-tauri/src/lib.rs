// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod agent;
pub mod commands;
pub mod docker;
pub mod git;
pub mod db; // SQLite
pub mod state;

pub use state::AppState;

use db::{config::DatabaseConfig, migrations};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().add_migrations(&DatabaseConfig::default().url, migrations::all()).build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

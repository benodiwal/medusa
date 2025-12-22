pub mod commands;
pub mod logging;
pub mod state;

pub use state::AppState;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    logging::init_logging();

    tracing::info!("Starting Medusa Plans application");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::add_plan,
            commands::get_all_plans,
            commands::get_plan,
            commands::start_review,
            commands::approve_plan,
            commands::deny_plan,
            commands::remove_plan,
            commands::clear_completed,
            commands::save_to_obsidian,
            commands::get_obsidian_vaults,
            commands::read_file,
            commands::open_in_obsidian,
            commands::get_settings,
            commands::save_settings,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.maximize().unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

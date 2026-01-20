use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tracing::info;
use uuid::Uuid;

/// Plan status in the Kanban board
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PlanStatus {
    Pending,
    InReview,
    Approved,
    Denied,
    ChangesRequested,
}

/// A plan item in the queue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanItem {
    pub id: String,
    pub content: String,
    pub source: Option<String>,
    pub project_name: String,
    pub session_id: Option<String>,
    pub response_file: Option<String>,
    pub status: PlanStatus,
    pub feedback: Option<String>,
    pub created_at: u64,
    /// Previous plan content (for diff view when revisions are made)
    #[serde(default)]
    pub previous_content: Option<String>,
    /// Annotations made during review (persisted so they survive modal close)
    #[serde(default)]
    pub annotations: Option<serde_json::Value>,
}

/// The plan queue storage
#[derive(Debug, Serialize, Deserialize)]
struct PlanQueue {
    plans: HashMap<String, PlanItem>,
}

static PLAN_QUEUE: std::sync::OnceLock<Mutex<PlanQueue>> = std::sync::OnceLock::new();

/// Get the path to the queue file
fn get_queue_file() -> PathBuf {
    let queue_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".medusa");
    fs::create_dir_all(&queue_dir).ok();
    queue_dir.join("queue.json")
}

/// Get the path to the pending directory
fn get_pending_dir() -> PathBuf {
    let pending_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".medusa")
        .join("pending");
    fs::create_dir_all(&pending_dir).ok();
    pending_dir
}

/// Load queue from file
fn load_queue_from_file() -> PlanQueue {
    let queue_file = get_queue_file();
    if queue_file.exists() {
        if let Ok(content) = fs::read_to_string(&queue_file) {
            if let Ok(queue) = serde_json::from_str(&content) {
                return queue;
            }
        }
    }
    PlanQueue {
        plans: HashMap::new(),
    }
}

/// Save queue to file
fn save_queue_to_file(queue: &PlanQueue) {
    let queue_file = get_queue_file();
    if let Ok(content) = serde_json::to_string_pretty(queue) {
        fs::write(&queue_file, content).ok();
    }
}

/// Pending plan file structure
#[derive(Debug, Serialize, Deserialize)]
struct PendingPlan {
    plan_file: String,
    response_file: String,
    /// Current working directory where Claude Code is running (for project identification)
    cwd: Option<String>,
}

/// Process pending plan files from ~/.medusa/pending/
fn process_pending_plans(queue: &mut PlanQueue) {
    let pending_dir = get_pending_dir();

    if let Ok(entries) = fs::read_dir(&pending_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map(|e| e == "json").unwrap_or(false) {
                // Read and process the pending plan
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(pending) = serde_json::from_str::<PendingPlan>(&content) {
                        // Read the actual plan content
                        if let Ok(plan_content) = fs::read_to_string(&pending.plan_file) {
                            // Derive project name from cwd (preferred) or fall back to plan file path
                            let project_name = pending.cwd
                                .as_ref()
                                .and_then(|c| PathBuf::from(c).file_name()?.to_str().map(String::from))
                                .unwrap_or_else(|| {
                                    // Fallback: try to get from plan file path (less reliable)
                                    PathBuf::from(&pending.plan_file)
                                        .parent()
                                        .and_then(|p| p.file_name())
                                        .and_then(|n| n.to_str())
                                        .map(String::from)
                                        .unwrap_or_else(|| "Unknown Project".to_string())
                                });

                            // Check if we already have a Pending plan from the same project
                            // This prevents duplicates when Claude retries or multiple hooks fire
                            let has_existing_pending = queue.plans.values().any(|p| {
                                p.project_name == project_name && p.status == PlanStatus::Pending
                            });

                            if has_existing_pending {
                                info!("Skipping duplicate pending plan for project: {}", project_name);
                                // Still delete the pending file
                                fs::remove_file(&path).ok();
                                continue;
                            }

                            // Find and capture content from ChangesRequested plan (for diff view)
                            let previous_content = queue.plans.values()
                                .find(|p| p.project_name == project_name && p.status == PlanStatus::ChangesRequested)
                                .map(|p| p.content.clone());

                            // Remove any ChangesRequested plans from the same project
                            // (Claude has submitted a revised version)
                            queue.plans.retain(|_, p| {
                                !(p.project_name == project_name && p.status == PlanStatus::ChangesRequested)
                            });

                            let id = Uuid::new_v4().to_string();
                            let plan = PlanItem {
                                id: id.clone(),
                                content: plan_content,
                                source: Some(pending.plan_file),
                                project_name,
                                session_id: None,
                                response_file: Some(pending.response_file),
                                status: PlanStatus::Pending,
                                feedback: None,
                                created_at: now(),
                                previous_content,
                                annotations: None,
                            };

                            queue.plans.insert(id.clone(), plan);
                            info!("Processed pending plan: {}", id);
                        }
                    }
                }
                // Delete the pending file after processing
                fs::remove_file(&path).ok();
            }
        }
    }
}

fn get_queue() -> &'static Mutex<PlanQueue> {
    PLAN_QUEUE.get_or_init(|| Mutex::new(load_queue_from_file()))
}

/// Get current timestamp in seconds
fn now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// ============== Request/Response types ==============

#[derive(Debug, Serialize, Deserialize)]
pub struct AddPlanRequest {
    pub content: String,
    pub source: Option<String>,
    pub project_name: Option<String>,
    pub session_id: Option<String>,
    pub response_file: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddPlanResponse {
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlanRequest {
    pub id: String,
    pub status: Option<PlanStatus>,
    pub feedback: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovePlanRequest {
    pub id: String,
    pub feedback: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DenyPlanRequest {
    pub id: String,
    pub feedback: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObsidianVault {
    pub name: String,
    pub path: String,
}

// ============== Tauri Commands ==============

/// Add a new plan to the queue
#[tauri::command]
pub async fn add_plan(request: AddPlanRequest) -> Result<AddPlanResponse, String> {
    info!("Adding new plan to queue");

    let id = Uuid::new_v4().to_string();
    let project_name = request.project_name
        .or_else(|| request.source.as_ref().and_then(|s| {
            PathBuf::from(s).parent()?.file_name()?.to_str().map(String::from)
        }))
        .unwrap_or_else(|| "Unknown Project".to_string());

    let plan = PlanItem {
        id: id.clone(),
        content: request.content,
        source: request.source,
        project_name,
        session_id: request.session_id,
        response_file: request.response_file,
        status: PlanStatus::Pending,
        feedback: None,
        created_at: now(),
        previous_content: None,
        annotations: None,
    };

    let queue = get_queue();
    let mut guard = queue.lock().map_err(|e| e.to_string())?;
    guard.plans.insert(id.clone(), plan);
    save_queue_to_file(&guard);

    info!("Plan {} added to queue", id);
    Ok(AddPlanResponse { id })
}

/// Get all plans in the queue (reloads from file to pick up external changes)
#[tauri::command]
pub async fn get_all_plans() -> Result<Vec<PlanItem>, String> {
    // Reload from file to pick up changes from other instances or CLI
    let mut fresh_queue = load_queue_from_file();

    // Process any pending plan files into the fresh queue
    // This ensures ChangesRequested plans are removed when new plans arrive
    process_pending_plans(&mut fresh_queue);

    let queue = get_queue();
    let mut guard = queue.lock().map_err(|e| e.to_string())?;

    // Use fresh queue as single source of truth
    *guard = fresh_queue;

    // Save any changes (processed pending plans, removals)
    save_queue_to_file(&guard);

    let mut plans: Vec<PlanItem> = guard.plans.values().cloned().collect();
    plans.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(plans)
}

/// Get a single plan by ID
#[tauri::command]
pub async fn get_plan(id: String) -> Result<Option<PlanItem>, String> {
    let queue = get_queue();
    let guard = queue.lock().map_err(|e| e.to_string())?;

    Ok(guard.plans.get(&id).cloned())
}

/// Start reviewing a plan (move to InReview status)
#[tauri::command]
pub async fn start_review(id: String) -> Result<(), String> {
    info!("Starting review for plan {}", id);

    let queue = get_queue();
    let mut guard = queue.lock().map_err(|e| e.to_string())?;

    if let Some(plan) = guard.plans.get_mut(&id) {
        plan.status = PlanStatus::InReview;
        save_queue_to_file(&guard);
    } else {
        return Err("Plan not found".to_string());
    }

    Ok(())
}

/// Approve a plan
#[tauri::command]
pub async fn approve_plan(request: ApprovePlanRequest) -> Result<(), String> {
    info!("Approving plan {}", request.id);

    let queue = get_queue();
    let mut guard = queue.lock().map_err(|e| e.to_string())?;

    if let Some(plan) = guard.plans.get_mut(&request.id) {
        plan.status = PlanStatus::Approved;
        plan.feedback = request.feedback.clone();

        // Write response to file if in hook mode
        if let Some(ref response_file) = plan.response_file {
            let response = if let Some(ref feedback) = request.feedback {
                format!("APPROVED\n{}", feedback)
            } else {
                "APPROVED".to_string()
            };

            fs::write(response_file, &response)
                .map_err(|e| format!("Failed to write response: {}", e))?;
            info!("Response written to: {}", response_file);
        }

        save_queue_to_file(&guard);
    } else {
        return Err("Plan not found".to_string());
    }

    Ok(())
}

/// Deny a plan with feedback (marks as ChangesRequested)
#[tauri::command]
pub async fn deny_plan(request: DenyPlanRequest) -> Result<(), String> {
    info!("Denying plan {}", request.id);

    let queue = get_queue();
    let mut guard = queue.lock().map_err(|e| e.to_string())?;

    if let Some(plan) = guard.plans.get_mut(&request.id) {
        // Write response to file if in hook mode
        if let Some(ref response_file) = plan.response_file {
            let response = format!("DENIED\n{}", request.feedback);

            fs::write(response_file, &response)
                .map_err(|e| format!("Failed to write response: {}", e))?;
            info!("Response written to: {}", response_file);
        }

        // Mark as ChangesRequested - shows user that Claude is working on revisions
        plan.status = PlanStatus::ChangesRequested;
        plan.feedback = Some(request.feedback.clone());
        save_queue_to_file(&guard);
    } else {
        return Err("Plan not found".to_string());
    }

    Ok(())
}

/// Remove a plan from the queue
#[tauri::command]
pub async fn remove_plan(id: String) -> Result<(), String> {
    info!("Removing plan {}", id);

    let queue = get_queue();
    let mut guard = queue.lock().map_err(|e| e.to_string())?;
    guard.plans.remove(&id);
    save_queue_to_file(&guard);

    Ok(())
}

/// Clear completed plans (approved only, ChangesRequested auto-clears when new plan arrives)
#[tauri::command]
pub async fn clear_completed() -> Result<(), String> {
    info!("Clearing completed plans");

    let queue = get_queue();
    let mut guard = queue.lock().map_err(|e| e.to_string())?;

    guard.plans.retain(|_, plan| {
        plan.status != PlanStatus::Approved
    });
    save_queue_to_file(&guard);

    Ok(())
}

/// Save annotations for a plan (persists across modal close/reopen)
#[tauri::command]
pub async fn save_annotations(id: String, annotations: serde_json::Value) -> Result<(), String> {
    info!("Saving annotations for plan {}", id);

    let queue = get_queue();
    let mut guard = queue.lock().map_err(|e| e.to_string())?;

    if let Some(plan) = guard.plans.get_mut(&id) {
        plan.annotations = Some(annotations);
        save_queue_to_file(&guard);
        info!("Annotations saved for plan {}", id);
    } else {
        return Err("Plan not found".to_string());
    }

    Ok(())
}

/// Save plan to Obsidian vault
#[tauri::command]
pub async fn save_to_obsidian(
    vault_path: String,
    filename: String,
    content: String,
) -> Result<(), String> {
    info!("Saving to Obsidian vault: {}", vault_path);

    let path = PathBuf::from(&vault_path).join(&filename);
    fs::write(&path, &content).map_err(|e| format!("Failed to save: {}", e))?;

    info!("Saved to: {:?}", path);
    Ok(())
}

/// Get list of Obsidian vaults
#[tauri::command]
pub async fn get_obsidian_vaults() -> Result<Vec<ObsidianVault>, String> {
    info!("Getting Obsidian vaults");

    let mut vaults = Vec::new();

    if let Some(home) = dirs::home_dir() {
        // macOS
        let mac_config = home.join("Library/Application Support/obsidian/obsidian.json");
        if mac_config.exists() {
            if let Ok(content) = fs::read_to_string(&mac_config) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(vault_list) = config.get("vaults").and_then(|v| v.as_object()) {
                        for (_, vault) in vault_list {
                            if let Some(path) = vault.get("path").and_then(|p| p.as_str()) {
                                let name = PathBuf::from(path)
                                    .file_name()
                                    .map(|n| n.to_string_lossy().to_string())
                                    .unwrap_or_else(|| "Unknown".to_string());
                                vaults.push(ObsidianVault {
                                    name,
                                    path: path.to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }

        // Linux
        let linux_config = home.join(".config/obsidian/obsidian.json");
        if linux_config.exists() {
            if let Ok(content) = fs::read_to_string(&linux_config) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(vault_list) = config.get("vaults").and_then(|v| v.as_object()) {
                        for (_, vault) in vault_list {
                            if let Some(path) = vault.get("path").and_then(|p| p.as_str()) {
                                let name = PathBuf::from(path)
                                    .file_name()
                                    .map(|n| n.to_string_lossy().to_string())
                                    .unwrap_or_else(|| "Unknown".to_string());
                                vaults.push(ObsidianVault {
                                    name,
                                    path: path.to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(vaults)
}

/// Read a file from disk
#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    info!("Reading file: {}", path);
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Open a URL or file using the system default handler
#[tauri::command]
pub async fn open_in_obsidian(vault_name: String, filename: String) -> Result<(), String> {
    info!("Opening in Obsidian: {} / {}", vault_name, filename);

    let url = format!(
        "obsidian://open?vault={}&file={}",
        urlencoding::encode(&vault_name),
        urlencoding::encode(&filename)
    );

    std::process::Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|e| format!("Failed to open Obsidian: {}", e))?;

    Ok(())
}

// ============== Settings ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedusaSettings {
    pub hook_timeout_minutes: u32,
}

impl Default for MedusaSettings {
    fn default() -> Self {
        Self {
            hook_timeout_minutes: 10, // 10 minutes default
        }
    }
}

fn get_settings_file() -> PathBuf {
    let settings_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".medusa");
    fs::create_dir_all(&settings_dir).ok();
    settings_dir.join("settings.json")
}

/// Get current settings
#[tauri::command]
pub async fn get_settings() -> Result<MedusaSettings, String> {
    let settings_file = get_settings_file();
    if settings_file.exists() {
        if let Ok(content) = fs::read_to_string(&settings_file) {
            if let Ok(settings) = serde_json::from_str(&content) {
                return Ok(settings);
            }
        }
    }
    Ok(MedusaSettings::default())
}

/// Save settings
#[tauri::command]
pub async fn save_settings(settings: MedusaSettings) -> Result<(), String> {
    info!("Saving settings: {:?}", settings);
    let settings_file = get_settings_file();
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&settings_file, content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    // Update hook config with new timeout setting
    if let Err(e) = crate::setup::update_hook_config() {
        tracing::warn!("Failed to update hook config after settings save: {}", e);
    }

    Ok(())
}

// ============== CLI Helpers ==============

/// Add a plan from CLI args (for hook mode) - persists to file
pub fn add_plan_from_cli(content: String, source: Option<String>, response_file: Option<String>) -> String {
    let id = Uuid::new_v4().to_string();
    let project_name = source.as_ref()
        .and_then(|s| PathBuf::from(s).parent()?.file_name()?.to_str().map(String::from))
        .unwrap_or_else(|| "Unknown Project".to_string());

    let plan = PlanItem {
        id: id.clone(),
        content,
        source,
        project_name,
        session_id: None,
        response_file,
        status: PlanStatus::Pending,
        feedback: None,
        created_at: now(),
        previous_content: None,
        annotations: None,
    };

    // Load existing queue from file, add plan, save back
    let mut queue = load_queue_from_file();
    queue.plans.insert(id.clone(), plan);
    save_queue_to_file(&queue);

    // Also update in-memory queue if initialized
    if let Some(mem_queue) = PLAN_QUEUE.get() {
        if let Ok(mut guard) = mem_queue.lock() {
            *guard = queue;
        }
    }

    id
}

// ============== History (SQLite) ==============

/// History item stored in SQLite
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: String,
    pub content: String,
    pub project_name: String,
    pub source: Option<String>,
    pub status: String, // "approved" or "rejected"
    pub feedback: Option<String>,
    pub annotations: Option<serde_json::Value>,
    pub created_at: u64,
    pub completed_at: u64,
}

/// Get the path to the history database
fn get_history_db_path() -> PathBuf {
    let db_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".medusa");
    fs::create_dir_all(&db_dir).ok();
    db_dir.join("history.db")
}

/// Initialize history database with schema
fn init_history_db() -> Result<Connection, String> {
    let db_path = get_history_db_path();
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open history database: {}", e))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            project_name TEXT NOT NULL,
            source TEXT,
            status TEXT NOT NULL,
            feedback TEXT,
            annotations TEXT,
            created_at INTEGER NOT NULL,
            completed_at INTEGER NOT NULL
        )",
        [],
    ).map_err(|e| format!("Failed to create history table: {}", e))?;

    // Create index for faster queries
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_history_completed_at ON history(completed_at DESC)",
        [],
    ).ok();

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_history_project_name ON history(project_name)",
        [],
    ).ok();

    Ok(conn)
}

/// Add a completed plan to history
#[tauri::command]
pub async fn add_to_history(
    id: String,
    content: String,
    project_name: String,
    source: Option<String>,
    status: String,
    feedback: Option<String>,
    annotations: Option<serde_json::Value>,
    created_at: u64,
) -> Result<(), String> {
    info!("Adding plan {} to history", id);

    let conn = init_history_db()?;
    let completed_at = now();
    let annotations_json = annotations.map(|a| a.to_string());

    conn.execute(
        "INSERT OR REPLACE INTO history (id, content, project_name, source, status, feedback, annotations, created_at, completed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, content, project_name, source, status, feedback, annotations_json, created_at, completed_at],
    ).map_err(|e| format!("Failed to insert into history: {}", e))?;

    info!("Plan {} added to history", id);
    Ok(())
}

/// Get history items with pagination
#[tauri::command]
pub async fn get_history(limit: Option<u32>, offset: Option<u32>) -> Result<Vec<HistoryItem>, String> {
    info!("Getting history");

    let conn = init_history_db()?;
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let mut stmt = conn.prepare(
        "SELECT id, content, project_name, source, status, feedback, annotations, created_at, completed_at
         FROM history ORDER BY completed_at DESC LIMIT ?1 OFFSET ?2"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let history_iter = stmt.query_map(params![limit, offset], |row| {
        let annotations_str: Option<String> = row.get(6)?;
        let annotations = annotations_str.and_then(|s| serde_json::from_str(&s).ok());

        Ok(HistoryItem {
            id: row.get(0)?,
            content: row.get(1)?,
            project_name: row.get(2)?,
            source: row.get(3)?,
            status: row.get(4)?,
            feedback: row.get(5)?,
            annotations,
            created_at: row.get(7)?,
            completed_at: row.get(8)?,
        })
    }).map_err(|e| format!("Failed to query history: {}", e))?;

    let mut history = Vec::new();
    for item in history_iter {
        if let Ok(item) = item {
            history.push(item);
        }
    }

    info!("Retrieved {} history items", history.len());
    Ok(history)
}

/// Search history by project name or content
#[tauri::command]
pub async fn search_history(query: String, limit: Option<u32>) -> Result<Vec<HistoryItem>, String> {
    info!("Searching history for: {}", query);

    let conn = init_history_db()?;
    let limit = limit.unwrap_or(50);
    let search_pattern = format!("%{}%", query);

    let mut stmt = conn.prepare(
        "SELECT id, content, project_name, source, status, feedback, annotations, created_at, completed_at
         FROM history
         WHERE project_name LIKE ?1 OR content LIKE ?1
         ORDER BY completed_at DESC LIMIT ?2"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let history_iter = stmt.query_map(params![search_pattern, limit], |row| {
        let annotations_str: Option<String> = row.get(6)?;
        let annotations = annotations_str.and_then(|s| serde_json::from_str(&s).ok());

        Ok(HistoryItem {
            id: row.get(0)?,
            content: row.get(1)?,
            project_name: row.get(2)?,
            source: row.get(3)?,
            status: row.get(4)?,
            feedback: row.get(5)?,
            annotations,
            created_at: row.get(7)?,
            completed_at: row.get(8)?,
        })
    }).map_err(|e| format!("Failed to search history: {}", e))?;

    let mut history = Vec::new();
    for item in history_iter {
        if let Ok(item) = item {
            history.push(item);
        }
    }

    info!("Found {} matching history items", history.len());
    Ok(history)
}

/// Clear history older than specified days (default 30 days for free tier)
#[tauri::command]
pub async fn clear_old_history(days: Option<u32>) -> Result<u32, String> {
    let days = days.unwrap_or(30);
    info!("Clearing history older than {} days", days);

    let conn = init_history_db()?;
    let cutoff = now().saturating_sub((days as u64) * 24 * 60 * 60);

    let deleted = conn.execute(
        "DELETE FROM history WHERE completed_at < ?1",
        params![cutoff],
    ).map_err(|e| format!("Failed to clear old history: {}", e))?;

    info!("Cleared {} old history items", deleted);
    Ok(deleted as u32)
}

/// Get history count
#[tauri::command]
pub async fn get_history_count() -> Result<u32, String> {
    let conn = init_history_db()?;

    let count: u32 = conn.query_row(
        "SELECT COUNT(*) FROM history",
        [],
        |row| row.get(0)
    ).map_err(|e| format!("Failed to count history: {}", e))?;

    Ok(count)
}

// ============== Kanban Task Management (Medusa 2.0) ==============

/// Task status in the Kanban board
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
    Backlog,
    InProgress,
    Review,
    Done,
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Backlog => write!(f, "Backlog"),
            TaskStatus::InProgress => write!(f, "InProgress"),
            TaskStatus::Review => write!(f, "Review"),
            TaskStatus::Done => write!(f, "Done"),
        }
    }
}

impl std::str::FromStr for TaskStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Backlog" => Ok(TaskStatus::Backlog),
            "InProgress" => Ok(TaskStatus::InProgress),
            "Review" => Ok(TaskStatus::Review),
            "Done" => Ok(TaskStatus::Done),
            // Support legacy Planning status by treating it as InProgress
            "Planning" => Ok(TaskStatus::InProgress),
            _ => Err(format!("Invalid task status: {}", s)),
        }
    }
}

/// A task in the Kanban board
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KanbanTask {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: TaskStatus,
    pub project_path: String,
    pub branch: Option<String>,
    pub worktree_path: Option<String>,
    pub plan_id: Option<String>,
    pub agent_pid: Option<u32>,
    pub session_id: Option<String>,  // Claude Code session ID for resuming
    pub base_commit: Option<String>, // The commit the worktree was created from (for accurate diffs)
    pub base_branch: Option<String>, // The branch the task was created from (for merging back)
    pub started_at: Option<u64>,
    pub completed_at: Option<u64>,
    pub files_changed: Option<Vec<String>>,
    pub diff_summary: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Request to create a new task
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub project_path: String,
}

/// Request to update a task
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub branch: Option<String>,
    pub plan_id: Option<String>,
}

/// Get the path to the tasks database
fn get_tasks_db_path() -> PathBuf {
    let db_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".medusa");
    fs::create_dir_all(&db_dir).ok();
    db_dir.join("tasks.db")
}

/// Initialize tasks database with schema
fn init_tasks_db() -> Result<Connection, String> {
    let db_path = get_tasks_db_path();
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open tasks database: {}", e))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS kanban_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Backlog',
            project_path TEXT NOT NULL,
            branch TEXT,
            worktree_path TEXT,
            plan_id TEXT,
            agent_pid INTEGER,
            session_id TEXT,
            started_at INTEGER,
            completed_at INTEGER,
            files_changed TEXT,
            diff_summary TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    ).map_err(|e| format!("Failed to create kanban_tasks table: {}", e))?;

    // Migration: add session_id column if it doesn't exist (for existing databases)
    conn.execute(
        "ALTER TABLE kanban_tasks ADD COLUMN session_id TEXT",
        [],
    ).ok(); // Ignore error if column already exists

    // Migration: add base_commit column if it doesn't exist
    conn.execute(
        "ALTER TABLE kanban_tasks ADD COLUMN base_commit TEXT",
        [],
    ).ok(); // Ignore error if column already exists

    // Migration: add base_branch column if it doesn't exist
    conn.execute(
        "ALTER TABLE kanban_tasks ADD COLUMN base_branch TEXT",
        [],
    ).ok(); // Ignore error if column already exists

    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status ON kanban_tasks(status)",
        [],
    ).ok();

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_tasks(project_path)",
        [],
    ).ok();

    Ok(conn)
}

/// Create a new task
#[tauri::command]
pub async fn create_task(request: CreateTaskRequest) -> Result<KanbanTask, String> {
    info!("Creating new task: {}", request.title);

    let conn = init_tasks_db()?;
    let id = Uuid::new_v4().to_string();
    let now_ts = now();

    let task = KanbanTask {
        id: id.clone(),
        title: request.title,
        description: request.description.unwrap_or_default(),
        status: TaskStatus::Backlog,
        project_path: request.project_path,
        branch: None,
        worktree_path: None,
        plan_id: None,
        agent_pid: None,
        session_id: None,
        base_commit: None,
        base_branch: None,
        started_at: None,
        completed_at: None,
        files_changed: None,
        diff_summary: None,
        created_at: now_ts,
        updated_at: now_ts,
    };

    conn.execute(
        "INSERT INTO kanban_tasks (id, title, description, status, project_path, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![task.id, task.title, task.description, task.status.to_string(), task.project_path, task.created_at, task.updated_at],
    ).map_err(|e| format!("Failed to create task: {}", e))?;

    info!("Task {} created", id);
    Ok(task)
}

/// Get all tasks
#[tauri::command]
pub async fn get_all_tasks() -> Result<Vec<KanbanTask>, String> {
    info!("Getting all tasks");

    let conn = init_tasks_db()?;

    let mut stmt = conn.prepare(
        "SELECT id, title, description, status, project_path, branch, worktree_path, plan_id,
                agent_pid, session_id, base_commit, base_branch, started_at, completed_at, files_changed, diff_summary, created_at, updated_at
         FROM kanban_tasks ORDER BY created_at DESC"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let tasks_iter = stmt.query_map([], |row| {
        let status_str: String = row.get(3)?;
        let files_changed_str: Option<String> = row.get(14)?;
        let files_changed = files_changed_str.and_then(|s| serde_json::from_str(&s).ok());

        Ok(KanbanTask {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            status: status_str.parse().unwrap_or(TaskStatus::Backlog),
            project_path: row.get(4)?,
            branch: row.get(5)?,
            worktree_path: row.get(6)?,
            plan_id: row.get(7)?,
            agent_pid: row.get(8)?,
            session_id: row.get(9)?,
            base_commit: row.get(10)?,
            base_branch: row.get(11)?,
            started_at: row.get(12)?,
            completed_at: row.get(13)?,
            files_changed,
            diff_summary: row.get(15)?,
            created_at: row.get(16)?,
            updated_at: row.get(17)?,
        })
    }).map_err(|e| format!("Failed to query tasks: {}", e))?;

    let mut tasks = Vec::new();
    for task in tasks_iter {
        if let Ok(task) = task {
            tasks.push(task);
        }
    }

    info!("Retrieved {} tasks", tasks.len());
    Ok(tasks)
}

/// Get a single task by ID
#[tauri::command]
pub async fn get_task(id: String) -> Result<Option<KanbanTask>, String> {
    info!("Getting task: {}", id);

    let conn = init_tasks_db()?;

    let result = conn.query_row(
        "SELECT id, title, description, status, project_path, branch, worktree_path, plan_id,
                agent_pid, session_id, base_commit, base_branch, started_at, completed_at, files_changed, diff_summary, created_at, updated_at
         FROM kanban_tasks WHERE id = ?1",
        params![id],
        |row| {
            let status_str: String = row.get(3)?;
            let files_changed_str: Option<String> = row.get(14)?;
            let files_changed = files_changed_str.and_then(|s| serde_json::from_str(&s).ok());

            Ok(KanbanTask {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                status: status_str.parse().unwrap_or(TaskStatus::Backlog),
                project_path: row.get(4)?,
                branch: row.get(5)?,
                worktree_path: row.get(6)?,
                plan_id: row.get(7)?,
                agent_pid: row.get(8)?,
                session_id: row.get(9)?,
                base_commit: row.get(10)?,
                base_branch: row.get(11)?,
                started_at: row.get(12)?,
                completed_at: row.get(13)?,
                files_changed,
                diff_summary: row.get(15)?,
                created_at: row.get(16)?,
                updated_at: row.get(17)?,
            })
        },
    );

    match result {
        Ok(task) => Ok(Some(task)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get task: {}", e)),
    }
}

/// Update a task
#[tauri::command]
pub async fn update_task(request: UpdateTaskRequest) -> Result<KanbanTask, String> {
    info!("Updating task: {}", request.id);

    let task_id = request.id.clone();

    // Do the database update in a block so all non-Send types are dropped before await
    {
        let conn = init_tasks_db()?;
        let now_ts = now();

        // Simple approach: update all fields, using COALESCE to keep existing values
        conn.execute(
            "UPDATE kanban_tasks SET
                title = COALESCE(?1, title),
                description = COALESCE(?2, description),
                status = COALESCE(?3, status),
                branch = COALESCE(?4, branch),
                plan_id = COALESCE(?5, plan_id),
                updated_at = ?6
             WHERE id = ?7",
            params![
                request.title,
                request.description,
                request.status.map(|s| s.to_string()),
                request.branch,
                request.plan_id,
                now_ts,
                request.id
            ],
        ).map_err(|e| format!("Failed to update task: {}", e))?;
    }

    // Return updated task
    get_task(task_id).await?.ok_or_else(|| "Task not found after update".to_string())
}

/// Update task status (convenience method for drag-and-drop)
#[tauri::command]
pub async fn update_task_status(id: String, status: TaskStatus) -> Result<KanbanTask, String> {
    info!("Updating task {} status to {:?}", id, status);

    // Check if task exists and is not already Done (Done tasks are read-only)
    let existing = get_task(id.clone()).await?;
    if let Some(ref task) = existing {
        if task.status == TaskStatus::Done {
            return Err("Cannot update a completed task. Done tasks are read-only.".to_string());
        }
    }

    let conn = init_tasks_db()?;
    let now_ts = now();

    // Set started_at when moving to InProgress
    let started_at = if status == TaskStatus::InProgress {
        Some(now_ts)
    } else {
        None
    };

    // Set completed_at when moving to Done
    let completed_at = if status == TaskStatus::Done {
        Some(now_ts)
    } else {
        None
    };

    conn.execute(
        "UPDATE kanban_tasks SET status = ?1, updated_at = ?2, started_at = COALESCE(?3, started_at), completed_at = ?4 WHERE id = ?5",
        params![status.to_string(), now_ts, started_at, completed_at, id],
    ).map_err(|e| format!("Failed to update task status: {}", e))?;

    get_task(id).await?.ok_or_else(|| "Task not found after update".to_string())
}

/// Delete a task
#[tauri::command]
pub async fn delete_task(id: String) -> Result<(), String> {
    info!("Deleting task: {}", id);

    let conn = init_tasks_db()?;

    conn.execute(
        "DELETE FROM kanban_tasks WHERE id = ?1",
        params![id],
    ).map_err(|e| format!("Failed to delete task: {}", e))?;

    info!("Task {} deleted", id);
    Ok(())
}

/// Get tasks by project path
#[tauri::command]
pub async fn get_tasks_by_project(project_path: String) -> Result<Vec<KanbanTask>, String> {
    info!("Getting tasks for project: {}", project_path);

    let conn = init_tasks_db()?;

    let mut stmt = conn.prepare(
        "SELECT id, title, description, status, project_path, branch, worktree_path, plan_id,
                agent_pid, session_id, base_commit, base_branch, started_at, completed_at, files_changed, diff_summary, created_at, updated_at
         FROM kanban_tasks WHERE project_path = ?1 ORDER BY created_at DESC"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let tasks_iter = stmt.query_map(params![project_path], |row| {
        let status_str: String = row.get(3)?;
        let files_changed_str: Option<String> = row.get(14)?;
        let files_changed = files_changed_str.and_then(|s| serde_json::from_str(&s).ok());

        Ok(KanbanTask {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            status: status_str.parse().unwrap_or(TaskStatus::Backlog),
            project_path: row.get(4)?,
            branch: row.get(5)?,
            worktree_path: row.get(6)?,
            plan_id: row.get(7)?,
            agent_pid: row.get(8)?,
            session_id: row.get(9)?,
            base_commit: row.get(10)?,
            base_branch: row.get(11)?,
            started_at: row.get(12)?,
            completed_at: row.get(13)?,
            files_changed,
            diff_summary: row.get(15)?,
            created_at: row.get(16)?,
            updated_at: row.get(17)?,
        })
    }).map_err(|e| format!("Failed to query tasks: {}", e))?;

    let mut tasks = Vec::new();
    for task in tasks_iter {
        if let Ok(task) = task {
            tasks.push(task);
        }
    }

    info!("Retrieved {} tasks for project", tasks.len());
    Ok(tasks)
}

// ============== Task Agent Commands (Phase 2) ==============

use crate::task_agent::{TaskAgentInfo, TASK_AGENT_MANAGER};

/// Start an agent for a task
#[tauri::command]
pub async fn start_task_agent(
    app: tauri::AppHandle,
    task_id: String,
    prompt: Option<String>,
) -> Result<TaskAgentInfo, String> {
    info!("Starting agent for task: {}", task_id);

    // Get the task to find project path
    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    // Use provided prompt or task description (just the description, not formatted)
    let prompt = prompt.unwrap_or_else(|| task.description.clone());

    // Start the agent
    let manager = TASK_AGENT_MANAGER.lock()
        .map_err(|e| format!("Failed to lock agent manager: {}", e))?;

    let agent_info = manager.start_agent(&task_id, &task.project_path, &prompt, app)
        .map_err(|e| format!("Failed to start agent: {}", e))?;

    // Update task with agent info
    let conn = init_tasks_db()?;
    let now_ts = now();

    conn.execute(
        "UPDATE kanban_tasks SET
            status = 'InProgress',
            agent_pid = ?1,
            branch = ?2,
            worktree_path = ?3,
            base_commit = ?4,
            base_branch = ?5,
            started_at = ?6,
            updated_at = ?7
         WHERE id = ?8",
        params![
            agent_info.pid,
            agent_info.branch,
            agent_info.worktree_path,
            agent_info.base_commit,
            agent_info.base_branch,
            now_ts,
            now_ts,
            task_id
        ],
    ).map_err(|e| format!("Failed to update task: {}", e))?;

    info!("Agent started for task {} with PID {}", task_id, agent_info.pid);
    Ok(agent_info)
}

/// Stop an agent for a task (pauses the agent, keeps task in InProgress)
#[tauri::command]
pub async fn stop_task_agent(task_id: String) -> Result<(), String> {
    info!("Pausing agent for task: {}", task_id);

    let manager = TASK_AGENT_MANAGER.lock()
        .map_err(|e| format!("Failed to lock agent manager: {}", e))?;

    manager.stop_agent(&task_id)
        .map_err(|e| format!("Failed to stop agent: {}", e))?;

    // Update task - only clear agent_pid, keep status as InProgress (paused state)
    let conn = init_tasks_db()?;
    let now_ts = now();

    conn.execute(
        "UPDATE kanban_tasks SET agent_pid = NULL, updated_at = ?1 WHERE id = ?2",
        params![now_ts, task_id],
    ).map_err(|e| format!("Failed to update task: {}", e))?;

    info!("Agent paused for task {}", task_id);
    Ok(())
}

/// Get agent info for a task
#[tauri::command]
pub async fn get_task_agent(task_id: String) -> Result<Option<TaskAgentInfo>, String> {
    let manager = TASK_AGENT_MANAGER.lock()
        .map_err(|e| format!("Failed to lock agent manager: {}", e))?;

    Ok(manager.get_agent(&task_id))
}

/// Get agent output for a task
#[tauri::command]
pub async fn get_task_agent_output(task_id: String) -> Result<Vec<String>, String> {
    let manager = TASK_AGENT_MANAGER.lock()
        .map_err(|e| format!("Failed to lock agent manager: {}", e))?;

    Ok(manager.get_agent_output(&task_id).unwrap_or_default())
}

/// Cleanup agent (stop and remove worktree)
#[tauri::command]
pub async fn cleanup_task_agent(task_id: String) -> Result<(), String> {
    info!("Cleaning up agent for task: {}", task_id);

    // Get task to find project path
    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    let manager = TASK_AGENT_MANAGER.lock()
        .map_err(|e| format!("Failed to lock agent manager: {}", e))?;

    manager.cleanup_agent(&task_id, &task.project_path)
        .map_err(|e| format!("Failed to cleanup agent: {}", e))?;

    // Update task
    let conn = init_tasks_db()?;
    let now_ts = now();

    conn.execute(
        "UPDATE kanban_tasks SET agent_pid = NULL, worktree_path = NULL, updated_at = ?1 WHERE id = ?2",
        params![now_ts, task_id],
    ).map_err(|e| format!("Failed to update task: {}", e))?;

    info!("Agent cleaned up for task {}", task_id);
    Ok(())
}

/// Get diff for a task's worktree
#[tauri::command]
pub async fn get_task_diff(task_id: String) -> Result<String, String> {
    use crate::git::GitManager;

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    let git = GitManager::new(task.project_path)
        .map_err(|e| format!("Failed to open git repo: {}", e))?;

    git.get_worktree_diff(&task_id)
        .map_err(|e| format!("Failed to get diff: {}", e))
}

/// Get changed files for a task's worktree
#[tauri::command]
pub async fn get_task_changed_files(task_id: String) -> Result<Vec<String>, String> {
    use crate::git::GitManager;

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    if task.worktree_path.is_none() {
        return Err("Task has no worktree".to_string());
    }

    let git = GitManager::new(task.project_path)
        .map_err(|e| format!("Failed to open git repo: {}", e))?;

    // Show changes vs the base commit (the commit the worktree was created from)
    // This shows ONLY what the agent changed, not inherited changes from parent branch
    git.get_worktree_all_changes_vs_base(&task_id, task.base_commit.as_deref())
        .map_err(|e| format!("Failed to get changed files: {}", e))
}

/// Send a message to a running agent
#[tauri::command]
pub async fn send_agent_message(task_id: String, message: String) -> Result<(), String> {
    info!("Sending message to agent {}: {}", task_id, message);

    let manager = TASK_AGENT_MANAGER.lock()
        .map_err(|e| format!("Failed to lock agent manager: {}", e))?;

    manager.send_message(&task_id, &message)
        .map_err(|e| format!("Failed to send message: {}", e))
}

/// Check if agent has active session
#[tauri::command]
pub async fn has_active_agent_session(task_id: String) -> Result<bool, String> {
    let manager = TASK_AGENT_MANAGER.lock()
        .map_err(|e| format!("Failed to lock agent manager: {}", e))?;

    Ok(manager.has_active_session(&task_id))
}

/// Get file diff for a specific file in task worktree
#[tauri::command]
pub async fn get_task_file_diff(task_id: String, file_path: String) -> Result<String, String> {
    use crate::git::GitManager;

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    if task.worktree_path.is_none() {
        return Err("Task has no worktree".to_string());
    }

    let git = GitManager::new(task.project_path)
        .map_err(|e| format!("Failed to open git repo: {}", e))?;

    // Show diff vs the base commit (the commit the worktree was created from)
    // This shows ONLY what the agent changed, not inherited changes from parent branch
    git.get_file_diff_vs_base(&task_id, &file_path, task.base_commit.as_deref())
        .map_err(|e| format!("Failed to get diff: {}", e))
}

/// Merge a task's worktree branch into main and mark as done
#[tauri::command]
pub async fn merge_task(task_id: String) -> Result<(), String> {
    use crate::git::GitManager;
    use std::process::Command;

    info!("Merging task: {}", task_id);

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    let branch = task.branch.as_ref()
        .ok_or_else(|| "Task has no branch to merge".to_string())?;

    let worktree_path = task.worktree_path.as_ref()
        .ok_or_else(|| "Task has no worktree".to_string())?;

    let git = GitManager::new(task.project_path.clone())
        .map_err(|e| format!("Failed to open git repo: {}", e))?;

    // Determine the target branch for merge:
    // - Use base_branch if available (the branch the task was created from)
    // - Fall back to current branch for old tasks without base_branch
    let target_branch = match &task.base_branch {
        Some(branch) => branch.clone(),
        None => git.current_branch()
            .map_err(|e| format!("Failed to get current branch: {}", e))?,
    };

    // Use base_commit for accurate file/commit stats, fall back to target_branch
    let base_ref = task.base_commit.as_deref().unwrap_or(&target_branch);

    // Capture files changed and commits BEFORE cleanup
    let files_output = Command::new("git")
        .args(["diff", "--name-only", &format!("{}...HEAD", base_ref)])
        .current_dir(worktree_path)
        .output()
        .map_err(|e| format!("Failed to get changed files: {}", e))?;

    let files_changed: Vec<String> = String::from_utf8_lossy(&files_output.stdout)
        .lines()
        .filter(|l| !l.is_empty())
        .map(|l| l.to_string())
        .collect();

    // Get commits (hash|message format)
    let commits_output = Command::new("git")
        .args(["log", &format!("{}..HEAD", base_ref), "--pretty=format:%h|%s"])
        .current_dir(worktree_path)
        .output()
        .map_err(|e| format!("Failed to get commits: {}", e))?;

    let commits_str = String::from_utf8_lossy(&commits_output.stdout).to_string();

    // Create a summary with commit info
    let diff_summary = if commits_str.is_empty() {
        format!("{} files changed", files_changed.len())
    } else {
        // Format: first line is summary, rest are commits
        let commit_lines: Vec<&str> = commits_str.lines().collect();
        let first_commit_msg = commit_lines.first()
            .and_then(|l| l.split('|').nth(1))
            .unwrap_or("Changes merged");
        format!("{}|{}", first_commit_msg, commits_str)
    };

    info!("Merging task branch {} into {}", branch, target_branch);

    // Merge the task branch into the target branch (the branch it was created from)
    git.merge(branch, &target_branch)
        .map_err(|e| format!("Failed to merge: {}", e))?;

    // Clean up worktree
    git.remove_worktree(&task_id)
        .map_err(|e| format!("Failed to remove worktree: {}", e))?;

    // Delete the task branch (commits are now in target branch)
    let _ = git.delete_branch(branch); // Ignore error if branch doesn't exist

    // Update task status to Done with captured info
    let conn = init_tasks_db()?;
    let now_ts = now();
    let files_json = serde_json::to_string(&files_changed).unwrap_or_default();

    conn.execute(
        "UPDATE kanban_tasks SET status = 'Done', completed_at = ?1, updated_at = ?2, worktree_path = NULL, files_changed = ?3, diff_summary = ?4 WHERE id = ?5",
        params![now_ts, now_ts, files_json, diff_summary, task_id],
    ).map_err(|e| format!("Failed to update task: {}", e))?;

    info!("Task {} merged successfully with {} files changed", task_id, files_changed.len());
    Ok(())
}

/// Reject a task - discard changes and move back to backlog
#[tauri::command]
pub async fn reject_task(task_id: String) -> Result<(), String> {
    use crate::git::GitManager;

    info!("Rejecting task: {}", task_id);

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    // Clean up agent if running
    {
        let manager = TASK_AGENT_MANAGER.lock()
            .map_err(|e| format!("Failed to lock agent manager: {}", e))?;
        let _ = manager.stop_agent(&task_id);
    }

    // Remove worktree if exists
    if task.worktree_path.is_some() {
        let git = GitManager::new(task.project_path.clone())
            .map_err(|e| format!("Failed to open git repo: {}", e))?;

        git.remove_worktree(&task_id)
            .map_err(|e| format!("Failed to remove worktree: {}", e))?;

        // Also delete the branch
        if let Some(ref branch) = task.branch {
            let _ = git.delete_branch(branch); // Ignore error if branch doesn't exist
        }
    }

    // Update task - move back to Backlog and clear all execution data
    let conn = init_tasks_db()?;
    let now_ts = now();

    conn.execute(
        "UPDATE kanban_tasks SET
            status = 'Backlog',
            agent_pid = NULL,
            session_id = NULL,
            branch = NULL,
            worktree_path = NULL,
            started_at = NULL,
            completed_at = NULL,
            files_changed = NULL,
            diff_summary = NULL,
            updated_at = ?1
         WHERE id = ?2",
        params![now_ts, task_id],
    ).map_err(|e| format!("Failed to update task: {}", e))?;

    // Also clean up session files
    let sessions_dir = dirs::home_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join(".medusa")
        .join("sessions");
    let _ = std::fs::remove_file(sessions_dir.join(format!("{}.jsonl", task_id)));
    let _ = std::fs::remove_file(sessions_dir.join(format!("{}.session_id", task_id)));

    info!("Task {} rejected and moved back to backlog", task_id);
    Ok(())
}

/// Commit for a task - used by Claude Code
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskCommit {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

/// Send task to review - auto-commit uncommitted changes using Claude Code
#[tauri::command]
pub async fn send_task_to_review(task_id: String) -> Result<(), String> {
    use std::process::Command;
    use std::sync::Mutex;
    use once_cell::sync::Lazy;

    // Prevent concurrent executions for the same task
    static REVIEW_LOCKS: Lazy<Mutex<std::collections::HashSet<String>>> = Lazy::new(|| Mutex::new(std::collections::HashSet::new()));

    // Check if already processing this task
    {
        let mut locks = REVIEW_LOCKS.lock().map_err(|e| format!("Lock error: {}", e))?;
        if locks.contains(&task_id) {
            return Err("Task is already being sent to review".to_string());
        }
        locks.insert(task_id.clone());
    }

    // Ensure we remove the lock when done (even on error)
    let _guard = scopeguard::guard(task_id.clone(), |id| {
        if let Ok(mut locks) = REVIEW_LOCKS.lock() {
            locks.remove(&id);
        }
    });

    info!("Sending task {} to review", task_id);

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    let worktree_path = task.worktree_path.as_ref()
        .ok_or_else(|| "Task has no worktree".to_string())?;

    // Check for uncommitted changes
    let status_output = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(worktree_path)
        .output()
        .map_err(|e| format!("Failed to check git status: {}", e))?;

    let has_uncommitted = !status_output.stdout.is_empty();

    if has_uncommitted {
        info!("Task {} has uncommitted changes, asking Claude to commit", task_id);

        // Use Claude Code to create a commit with a good message
        // Use shell wrapper to ensure nvm/claude is available
        let home = std::env::var("HOME").unwrap_or_else(|_| "/Users".to_string());
        let commit_prompt = "Commit all the current changes with a concise one-line commit message that describes what was done. Use conventional commit format (feat:, fix:, etc). Do NOT include Co-Authored-By. Just run git add -A and git commit.";

        let shell_cmd = format!(
            "export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; claude -p '{}' --allowedTools Bash --max-turns 3",
            commit_prompt.replace("'", "'\\''")
        );

        let output = Command::new("/bin/zsh")
            .args(["-c", &shell_cmd])
            .env("HOME", &home)
            .current_dir(worktree_path)
            .output()
            .map_err(|e| format!("Failed to run Claude for commit: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // If Claude fails, fallback to simple commit
            info!("Claude commit failed ({}), using fallback", stderr);

            Command::new("git")
                .args(["add", "-A"])
                .current_dir(worktree_path)
                .output()
                .map_err(|e| format!("Failed to stage changes: {}", e))?;

            Command::new("git")
                .args(["commit", "-m", &format!("feat: {}", task.title)])
                .current_dir(worktree_path)
                .output()
                .map_err(|e| format!("Failed to commit: {}", e))?;
        }
    }

    // Update task status to Review
    let conn = init_tasks_db()?;
    let now_ts = now();

    conn.execute(
        "UPDATE kanban_tasks SET status = 'Review', updated_at = ?1 WHERE id = ?2",
        params![now_ts, task_id],
    ).map_err(|e| format!("Failed to update task status: {}", e))?;

    info!("Task {} sent to review", task_id);
    Ok(())
}

/// Get commits for a task branch (compared to main)
#[tauri::command]
pub async fn get_task_commits(task_id: String) -> Result<Vec<TaskCommit>, String> {
    use crate::git::GitManager;
    use std::process::Command;

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    let worktree_path = task.worktree_path.as_ref()
        .ok_or_else(|| "Task has no worktree".to_string())?;

    let git = GitManager::new(task.project_path.clone())
        .map_err(|e| format!("Failed to open git repo: {}", e))?;

    // Use base_commit if available, otherwise fall back to main branch
    let base_ref = match &task.base_commit {
        Some(commit) => commit.clone(),
        None => git.get_main_branch_name()
            .map_err(|e| format!("Failed to detect main branch: {}", e))?,
    };

    // Get commits on this branch since the base commit
    // Format: hash|short_hash|message|author|date
    let output = Command::new("git")
        .args([
            "log",
            &format!("{}..HEAD", base_ref),
            "--pretty=format:%H|%h|%s|%an|%ar",
        ])
        .current_dir(worktree_path)
        .output()
        .map_err(|e| format!("Failed to get commits: {}", e))?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    let commits: Vec<TaskCommit> = output_str
        .lines()
        .filter(|line| !line.is_empty())
        .filter_map(|line| {
            let parts: Vec<&str> = line.splitn(5, '|').collect();
            if parts.len() >= 5 {
                Some(TaskCommit {
                    hash: parts[0].to_string(),
                    short_hash: parts[1].to_string(),
                    message: parts[2].to_string(),
                    author: parts[3].to_string(),
                    date: parts[4].to_string(),
                })
            } else {
                None
            }
        })
        .collect();

    Ok(commits)
}

/// Amend the last commit message for a task
#[tauri::command]
pub async fn amend_task_commit(task_id: String, new_message: String) -> Result<(), String> {
    use std::process::Command;

    info!("Amending commit message for task {}", task_id);

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    let worktree_path = task.worktree_path.as_ref()
        .ok_or_else(|| "Task has no worktree".to_string())?;

    let output = Command::new("git")
        .args(["commit", "--amend", "-m", &new_message])
        .current_dir(worktree_path)
        .output()
        .map_err(|e| format!("Failed to amend commit: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to amend commit: {}", stderr));
    }

    info!("Commit message amended for task {}", task_id);
    Ok(())
}

/// Check if task has uncommitted changes
#[tauri::command]
pub async fn has_uncommitted_changes(task_id: String) -> Result<bool, String> {
    use std::process::Command;

    let task = get_task(task_id.clone()).await?
        .ok_or_else(|| format!("Task not found: {}", task_id))?;

    let worktree_path = match &task.worktree_path {
        Some(p) => p,
        None => return Ok(false),
    };

    let output = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(worktree_path)
        .output()
        .map_err(|e| format!("Failed to check git status: {}", e))?;

    Ok(!output.stdout.is_empty())
}

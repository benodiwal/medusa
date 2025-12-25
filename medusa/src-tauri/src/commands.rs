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
                            let project_name = PathBuf::from(&pending.plan_file)
                                .parent()
                                .and_then(|p| p.file_name())
                                .and_then(|n| n.to_str())
                                .map(String::from)
                                .unwrap_or_else(|| "Unknown Project".to_string());

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

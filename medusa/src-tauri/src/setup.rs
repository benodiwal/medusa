//! Automatic setup for Medusa hooks and configuration
//!
//! This module handles the automatic installation of:
//! - Hook script at ~/.claude/hooks/medusa-plan-review.sh
//! - Hook configuration in ~/.claude/settings.json

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;
use tracing::info;

/// The hook script content - embedded in the binary
const HOOK_SCRIPT: &str = r#"#!/bin/bash

# Medusa Plan Review Hook for Claude Code
# Automatically installed by Medusa app

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [ "$TOOL_NAME" != "ExitPlanMode" ]; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
fi

PLANS_DIR="$HOME/.claude/plans"
PROJECT_NAME=$(basename "$CWD" 2>/dev/null)

# Find recent plan files (within last 5 minutes to handle delays)
RECENT_PLANS=$(find "$PLANS_DIR" -name "*.md" -mmin -5 -type f 2>/dev/null)

if [ -n "$RECENT_PLANS" ]; then
    if [ -n "$PROJECT_NAME" ]; then
        PLAN_FILE=$(echo "$RECENT_PLANS" | xargs grep -l "$PROJECT_NAME" 2>/dev/null | head -1)
    fi
    if [ -z "$PLAN_FILE" ]; then
        PLAN_FILE=$(echo "$RECENT_PLANS" | head -1)
    fi
fi

if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
    PLAN_FILE=$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -1)
fi

# If still no plan file found, wait a moment and try again (handles timing issues)
if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
    sleep 2
    PLAN_FILE=$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -1)
fi

# If no plan file exists at all, deny to prevent unintended execution
if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
    echo "No plan file found in $PLANS_DIR - cannot proceed without a plan" >&2
    exit 2
fi

RESPONSE_FILE="/tmp/medusa-response-${SESSION_ID:-$$}"
PENDING_DIR="$HOME/.medusa/pending"
mkdir -p "$PENDING_DIR"

cat > "$PENDING_DIR/$(uuidgen).json" << EOF
{"plan_file": "$PLAN_FILE", "response_file": "$RESPONSE_FILE"}
EOF

# Open Medusa app
MEDUSA_APP="/Applications/medusa.app"
open -a "$MEDUSA_APP" 2>/dev/null || true

# Wait indefinitely for response
while true; do
    if [ -f "$RESPONSE_FILE" ] && [ -s "$RESPONSE_FILE" ]; then
        RESPONSE=$(cat "$RESPONSE_FILE")
        rm -f "$RESPONSE_FILE"
        DECISION=$(echo "$RESPONSE" | head -1)
        FEEDBACK=$(echo "$RESPONSE" | tail -n +2)

        if [ "$DECISION" = "APPROVED" ]; then
            echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
            exit 0
        else
            echo "$FEEDBACK" >&2
            exit 2
        fi
    fi
    sleep 1
done
"#;

/// Setup status returned to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetupStatus {
    pub hook_script_installed: bool,
    pub hook_script_executable: bool,
    pub hook_config_installed: bool,
    pub medusa_dir_exists: bool,
    pub needs_setup: bool,
    pub hook_script_path: String,
    pub settings_path: String,
}

/// Get paths for setup
fn get_hook_script_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".claude")
        .join("hooks")
        .join("medusa-plan-review.sh")
}

fn get_claude_settings_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".claude")
        .join("settings.json")
}

fn get_medusa_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".medusa")
}

/// Check if hook script exists and contains our marker
fn is_hook_script_installed() -> bool {
    let path = get_hook_script_path();
    if !path.exists() {
        return false;
    }

    // Check if it contains our marker
    if let Ok(content) = fs::read_to_string(&path) {
        return content.contains("Medusa Plan Review Hook");
    }

    false
}

/// Check if hook script has executable permissions
fn is_hook_script_executable() -> bool {
    let path = get_hook_script_path();
    if !path.exists() {
        return false;
    }

    if let Ok(metadata) = fs::metadata(&path) {
        let permissions = metadata.permissions();
        // Check if any execute bit is set (user, group, or other)
        return permissions.mode() & 0o111 != 0;
    }

    false
}

/// Ensure hook script has executable permissions
fn ensure_hook_script_executable() -> Result<()> {
    let path = get_hook_script_path();
    if !path.exists() {
        return Err(anyhow::anyhow!("Hook script does not exist"));
    }

    let mut permissions = fs::metadata(&path)?.permissions();
    let current_mode = permissions.mode();

    // Check if already executable
    if current_mode & 0o111 != 0 {
        return Ok(());
    }

    // Add executable permission (chmod +x)
    permissions.set_mode(current_mode | 0o755);
    fs::set_permissions(&path, permissions)?;

    info!("Fixed executable permissions for hook script at {:?}", path);
    Ok(())
}

/// Check if Claude settings have Medusa hook configured
fn is_hook_config_installed() -> bool {
    let path = get_claude_settings_path();
    if !path.exists() {
        return false;
    }

    if let Ok(content) = fs::read_to_string(&path) {
        if let Ok(settings) = serde_json::from_str::<serde_json::Value>(&content) {
            // Check if hooks.PreToolUse contains our ExitPlanMode matcher
            if let Some(hooks) = settings.get("hooks") {
                if let Some(pre_tool_use) = hooks.get("PreToolUse") {
                    if let Some(arr) = pre_tool_use.as_array() {
                        for item in arr {
                            if let Some(matcher) = item.get("matcher") {
                                if matcher.as_str() == Some("ExitPlanMode") {
                                    // Check if it points to our script
                                    if let Some(hooks_arr) = item.get("hooks") {
                                        if let Some(hooks_list) = hooks_arr.as_array() {
                                            for hook in hooks_list {
                                                if let Some(cmd) = hook.get("command") {
                                                    if let Some(cmd_str) = cmd.as_str() {
                                                        if cmd_str.contains("medusa-plan-review.sh") {
                                                            return true;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    false
}

/// Install the hook script
fn install_hook_script() -> Result<()> {
    let path = get_hook_script_path();

    // Create parent directories
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    // Write the script
    fs::write(&path, HOOK_SCRIPT)?;

    // Make executable (chmod +x)
    let mut permissions = fs::metadata(&path)?.permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(&path, permissions)?;

    info!("Installed hook script at {:?}", path);
    Ok(())
}

/// Get the current hook timeout in seconds from Medusa settings
fn get_hook_timeout_seconds() -> u64 {
    let settings_file = get_medusa_dir().join("settings.json");
    if settings_file.exists() {
        if let Ok(content) = fs::read_to_string(&settings_file) {
            if let Ok(settings) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(minutes) = settings.get("hook_timeout_minutes").and_then(|v| v.as_u64()) {
                    return minutes * 60;
                }
            }
        }
    }
    // Default: 10 minutes in seconds
    600
}

/// Install hook configuration in Claude settings
fn install_hook_config() -> Result<()> {
    let path = get_claude_settings_path();

    // Create parent directories
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    // Read existing settings or create new
    let mut settings: serde_json::Value = if path.exists() {
        let content = fs::read_to_string(&path)?;
        serde_json::from_str(&content).unwrap_or_else(|_| serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Get timeout from Medusa settings
    let timeout_seconds = get_hook_timeout_seconds();

    // Create the hook configuration
    let medusa_hook = serde_json::json!({
        "matcher": "ExitPlanMode",
        "hooks": [
            {
                "type": "command",
                "command": "~/.claude/hooks/medusa-plan-review.sh",
                "timeout": timeout_seconds
            }
        ]
    });

    // Ensure hooks.PreToolUse exists and add our hook
    if settings.get("hooks").is_none() {
        settings["hooks"] = serde_json::json!({});
    }

    let hooks = settings.get_mut("hooks").unwrap();

    if hooks.get("PreToolUse").is_none() {
        hooks["PreToolUse"] = serde_json::json!([]);
    }

    let pre_tool_use = hooks.get_mut("PreToolUse").unwrap();

    if let Some(arr) = pre_tool_use.as_array_mut() {
        // Remove any existing ExitPlanMode hooks (to update)
        arr.retain(|item| {
            item.get("matcher").and_then(|m| m.as_str()) != Some("ExitPlanMode")
        });

        // Add our hook
        arr.push(medusa_hook);
    }

    // Write back
    let content = serde_json::to_string_pretty(&settings)?;
    fs::write(&path, content)?;

    info!("Installed hook configuration at {:?}", path);
    Ok(())
}

/// Create Medusa data directory
fn ensure_medusa_dir() -> Result<()> {
    let path = get_medusa_dir();
    fs::create_dir_all(&path)?;

    // Also create subdirectories
    fs::create_dir_all(path.join("pending"))?;
    fs::create_dir_all(path.join("sessions"))?;

    info!("Created Medusa directory at {:?}", path);
    Ok(())
}

/// Check current setup status
pub fn check_setup_status() -> SetupStatus {
    let script_installed = is_hook_script_installed();
    let script_executable = is_hook_script_executable();
    let config_installed = is_hook_config_installed();

    SetupStatus {
        hook_script_installed: script_installed,
        hook_script_executable: script_executable,
        hook_config_installed: config_installed,
        medusa_dir_exists: get_medusa_dir().exists(),
        needs_setup: !script_installed || !script_executable || !config_installed,
        hook_script_path: get_hook_script_path().to_string_lossy().to_string(),
        settings_path: get_claude_settings_path().to_string_lossy().to_string(),
    }
}

/// Run automatic setup if needed
pub fn run_auto_setup() -> Result<SetupStatus> {
    info!("Running Medusa auto-setup...");

    // Step 1: Always ensure medusa dir exists
    if let Err(e) = ensure_medusa_dir() {
        tracing::warn!("Failed to create medusa directory: {}", e);
    }

    // Step 2: Try to install hook script (don't fail if this errors - continue with config)
    if !is_hook_script_installed() {
        if let Err(e) = install_hook_script() {
            tracing::warn!("Failed to install hook script: {}", e);
        }
    }

    // Step 3: Ensure hook script has executable permissions
    if is_hook_script_installed() && !is_hook_script_executable() {
        if let Err(e) = ensure_hook_script_executable() {
            tracing::warn!("Failed to set executable permissions on hook script: {}", e);
        }
    }

    // Step 4: Try to install hook config (independent of script installation)
    if !is_hook_config_installed() {
        if let Err(e) = install_hook_config() {
            tracing::warn!("Failed to install hook config: {}", e);
        }
    }

    let status = check_setup_status();
    info!("Auto-setup complete: {:?}", status);

    Ok(status)
}

/// Force reinstall everything (for troubleshooting)
pub fn force_reinstall() -> Result<SetupStatus> {
    info!("Force reinstalling Medusa setup...");

    if let Err(e) = ensure_medusa_dir() {
        tracing::warn!("Failed to create medusa directory: {}", e);
    }

    // Try both installations independently
    if let Err(e) = install_hook_script() {
        tracing::warn!("Failed to install hook script: {}", e);
    }

    // Ensure executable permissions
    if is_hook_script_installed() {
        if let Err(e) = ensure_hook_script_executable() {
            tracing::warn!("Failed to set executable permissions on hook script: {}", e);
        }
    }

    if let Err(e) = install_hook_config() {
        tracing::warn!("Failed to install hook config: {}", e);
    }

    Ok(check_setup_status())
}

/// Update just the hook config (e.g., when settings change)
pub fn update_hook_config() -> Result<()> {
    info!("Updating hook config with current settings...");
    install_hook_config()
}

// ============== Tauri Commands ==============

/// Check setup status
#[tauri::command]
pub async fn get_setup_status() -> Result<SetupStatus, String> {
    Ok(check_setup_status())
}

/// Run auto setup
#[tauri::command]
pub async fn auto_setup() -> Result<SetupStatus, String> {
    run_auto_setup().map_err(|e| format!("Setup failed: {}", e))
}

/// Force reinstall setup
#[tauri::command]
pub async fn reinstall_setup() -> Result<SetupStatus, String> {
    force_reinstall().map_err(|e| format!("Reinstall failed: {}", e))
}

/// Update hook config (call after changing settings like timeout)
#[tauri::command]
pub async fn update_hook_settings() -> Result<(), String> {
    update_hook_config().map_err(|e| format!("Failed to update hook config: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auto_setup() {
        // Run auto setup
        let result = run_auto_setup();
        assert!(result.is_ok(), "Auto setup failed: {:?}", result.err());
        
        let status = result.unwrap();
        println!("Setup status: {:?}", status);
        
        assert!(status.hook_script_installed, "Hook script not installed");
        assert!(status.hook_config_installed, "Hook config not installed");
        assert!(status.medusa_dir_exists, "Medusa dir not created");
        assert!(!status.needs_setup, "Setup still needed");
    }
}

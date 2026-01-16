//! Task Agent - Manages Claude Code processes for tasks
//!
//! This module handles spawning and managing Claude Code CLI processes
//! that work on tasks in isolated git worktrees.

use crate::git::GitManager;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};
use tracing::{debug, error, info, warn};

/// Get the directory for storing session files
fn get_sessions_dir() -> PathBuf {
    let sessions_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".medusa")
        .join("sessions");
    fs::create_dir_all(&sessions_dir).ok();
    sessions_dir
}

/// Get the session file path for a task
fn get_session_file(task_id: &str) -> PathBuf {
    get_sessions_dir().join(format!("{}.jsonl", task_id))
}

/// Append a line to the session file
fn append_to_session_file(task_id: &str, line: &str) {
    let file_path = get_session_file(task_id);
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
    {
        let _ = writeln!(file, "{}", line);
    }
}

/// Load session from file
fn load_session_file(task_id: &str) -> Vec<String> {
    let file_path = get_session_file(task_id);
    if file_path.exists() {
        if let Ok(content) = fs::read_to_string(&file_path) {
            return content.lines().map(|s| s.to_string()).collect();
        }
    }
    Vec::new()
}

/// Get the session_id file path for a task
fn get_session_id_file(task_id: &str) -> PathBuf {
    get_sessions_dir().join(format!("{}.session_id", task_id))
}

/// Save session_id to file
fn save_session_id(task_id: &str, session_id: &str) {
    let file_path = get_session_id_file(task_id);
    let _ = fs::write(&file_path, session_id);
}

/// Load session_id from file
fn load_session_id(task_id: &str) -> Option<String> {
    let file_path = get_session_id_file(task_id);
    if file_path.exists() {
        fs::read_to_string(&file_path).ok().map(|s| s.trim().to_string())
    } else {
        None
    }
}

/// Check if Claude Code CLI is installed and accessible
pub fn check_claude_cli_installed() -> Result<()> {
    // Try to find claude in PATH using which/where
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users".to_string());

    // Use zsh with nvm sourced to check for claude
    let shell_cmd = "export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; which claude";

    let output = Command::new("/bin/zsh")
        .args(["-c", shell_cmd])
        .env("HOME", &home)
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                let path = String::from_utf8_lossy(&result.stdout);
                info!("Found Claude CLI at: {}", path.trim());
                Ok(())
            } else {
                Err(anyhow::anyhow!(
                    "Claude Code CLI not found. Please install it first:\n\
                    npm install -g @anthropic-ai/claude-code\n\n\
                    Or visit: https://docs.anthropic.com/en/docs/claude-code"
                ))
            }
        }
        Err(e) => {
            Err(anyhow::anyhow!(
                "Failed to check for Claude Code CLI: {}. Please ensure it's installed.", e
            ))
        }
    }
}

/// Validate that a path is a valid git repository
pub fn validate_git_repository(project_path: &str) -> Result<()> {
    let git_dir = std::path::Path::new(project_path).join(".git");
    if !git_dir.exists() {
        return Err(anyhow::anyhow!(
            "Not a git repository: {}\n\n\
            Please initialize git first:\n\
            cd {} && git init",
            project_path,
            project_path
        ));
    }
    Ok(())
}

/// Status of a task agent
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskAgentStatus {
    Starting,
    Running,
    Completed,
    Failed,
    Stopped,
}

/// Information about a running task agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskAgentInfo {
    pub task_id: String,
    pub pid: u32,
    pub status: TaskAgentStatus,
    pub worktree_path: String,
    pub branch: String,
    pub base_commit: String, // The commit the worktree was created from (for accurate diffs)
    pub base_branch: String, // The branch the task was created from (for merging back)
    pub started_at: i64,
    pub output_lines: Vec<String>,
}

/// Event emitted when agent output is received
#[derive(Debug, Clone, Serialize)]
pub struct AgentOutputEvent {
    pub task_id: String,
    pub line: String,
    pub is_error: bool,
}

/// Event emitted when agent status changes
#[derive(Debug, Clone, Serialize)]
pub struct AgentStatusEvent {
    pub task_id: String,
    pub status: TaskAgentStatus,
    pub message: Option<String>,
}

/// Manages task agents
pub struct TaskAgentManager {
    agents: Arc<Mutex<HashMap<String, TaskAgentProcess>>>,
    /// Store stdin handles for interactive sessions
    stdin_handles: Arc<Mutex<HashMap<String, ChildStdin>>>,
}

struct TaskAgentProcess {
    info: TaskAgentInfo,
    #[allow(dead_code)]
    child: Option<Child>,
}

impl TaskAgentManager {
    pub fn new() -> Self {
        Self {
            agents: Arc::new(Mutex::new(HashMap::new())),
            stdin_handles: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Start an interactive agent for a task
    pub fn start_agent(
        &self,
        task_id: &str,
        project_path: &str,
        initial_prompt: &str,
        app_handle: AppHandle,
    ) -> Result<TaskAgentInfo> {
        info!("Starting interactive agent for task {} in {}", task_id, project_path);

        // Pre-flight checks
        // 1. Check if Claude CLI is installed
        check_claude_cli_installed()?;

        // 2. Validate git repository
        validate_git_repository(project_path)?;

        // Create branch name from task ID
        let branch_name = format!("medusa/task-{}", &task_id[..8]);

        // Create git manager and worktree
        let git = GitManager::new(project_path.to_string())?;

        // IMPORTANT: Capture the current HEAD commit and branch BEFORE creating the worktree
        // base_commit is used for accurate diffs (only shows agent's changes)
        // base_branch is used to merge back to the original branch
        let base_commit = git.get_current_commit_hash()?;
        let base_branch = git.current_branch()?;
        info!("Base commit for task {}: {} (branch: {})", task_id, base_commit, base_branch);

        let worktree_path = git.create_worktree(task_id, &branch_name)?;

        info!("Created worktree at {:?} on branch {}", worktree_path, branch_name);

        // Wrap the rest in a closure so we can cleanup worktree on failure
        let result = self.spawn_agent_process(
            task_id,
            project_path,
            &worktree_path.to_string_lossy(),
            &branch_name,
            &base_commit,
            &base_branch,
            initial_prompt,
            app_handle,
        );

        // If spawn failed, cleanup the worktree
        if result.is_err() {
            warn!("Agent spawn failed, cleaning up worktree for task {}", task_id);
            if let Err(cleanup_err) = git.remove_worktree(task_id) {
                error!("Failed to cleanup worktree after spawn failure: {}", cleanup_err);
            }
        }

        result
    }

    /// Internal method to spawn the agent process (separated for cleanup handling)
    fn spawn_agent_process(
        &self,
        task_id: &str,
        _project_path: &str,
        worktree_path: &str,
        branch_name: &str,
        base_commit: &str,
        base_branch: &str,
        initial_prompt: &str,
        app_handle: AppHandle,
    ) -> Result<TaskAgentInfo> {

        // Check if we have an existing session to resume
        let existing_session_id = load_session_id(task_id);

        // Build claude args
        let claude_args = if let Some(ref session_id) = existing_session_id {
            info!("Resuming session {} for task {}", session_id, task_id);
            format!(
                "--resume {} --verbose --output-format stream-json --input-format stream-json --dangerously-skip-permissions",
                session_id
            )
        } else {
            "--verbose --output-format stream-json --input-format stream-json --dangerously-skip-permissions".to_string()
        };

        // Use zsh with nvm sourced explicitly
        let home = std::env::var("HOME").unwrap_or_else(|_| {
            // Fallback: try to get home from /etc/passwd or use a default
            std::env::var("USER")
                .map(|u| format!("/Users/{}", u))
                .unwrap_or_else(|_| "/Users".to_string())
        });

        let shell_cmd = format!(
            "export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; claude {}",
            claude_args
        );
        info!("Running via shell: {}", shell_cmd);

        let mut cmd = Command::new("/bin/zsh");
        cmd.args(["-c", &shell_cmd])
            .env("HOME", &home)
            .current_dir(&worktree_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Spawn the process
        let mut child = cmd.spawn().map_err(|e| {
            error!("Failed to spawn claude process: {}", e);
            anyhow::anyhow!("Failed to spawn claude: {}. Is Claude Code CLI installed?", e)
        })?;

        let pid = child.id();
        info!("Spawned Claude process with PID {} for task {}", pid, task_id);

        let info = TaskAgentInfo {
            task_id: task_id.to_string(),
            pid,
            status: TaskAgentStatus::Running,
            worktree_path: worktree_path.to_string(),
            branch: branch_name.to_string(),
            base_commit: base_commit.to_string(),
            base_branch: base_branch.to_string(),
            started_at: chrono::Utc::now().timestamp(),
            output_lines: Vec::new(),
        };

        // Take stdin for sending messages
        let stdin = child.stdin.take();
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        // Store stdin handle for later use
        if let Some(stdin) = stdin {
            let mut handles = self.stdin_handles.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
            handles.insert(task_id.to_string(), stdin);
        }

        // Set up stdout streaming
        let task_id_clone = task_id.to_string();
        let agents_clone = Arc::clone(&self.agents);
        let app_handle_stdout = app_handle.clone();

        if let Some(stdout) = stdout {
            thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines() {
                    match line {
                        Ok(line) => {
                            debug!("Agent {} stdout: {}", task_id_clone, line);

                            // Try to extract session_id from init message
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&line) {
                                if json.get("type").and_then(|t| t.as_str()) == Some("system")
                                    && json.get("subtype").and_then(|t| t.as_str()) == Some("init")
                                {
                                    if let Some(session_id) = json.get("session_id").and_then(|s| s.as_str()) {
                                        info!("Captured session_id for task {}: {}", task_id_clone, session_id);
                                        // Save session_id to file for persistence
                                        save_session_id(&task_id_clone, session_id);
                                    }
                                }
                            }

                            // Persist to session file
                            append_to_session_file(&task_id_clone, &line);

                            // Store output line in memory (with limit to prevent memory leak)
                            const MAX_OUTPUT_LINES: usize = 10000;
                            const TRIM_AMOUNT: usize = 2000;

                            if let Ok(mut agents) = agents_clone.lock() {
                                if let Some(agent) = agents.get_mut(&task_id_clone) {
                                    agent.info.output_lines.push(line.clone());

                                    // Trim old lines if we exceed the limit
                                    if agent.info.output_lines.len() > MAX_OUTPUT_LINES {
                                        agent.info.output_lines.drain(0..TRIM_AMOUNT);
                                        debug!("Trimmed {} old output lines for task {}", TRIM_AMOUNT, task_id_clone);
                                    }
                                }
                            }

                            // Emit event to frontend
                            let _ = app_handle_stdout.emit("agent-output", AgentOutputEvent {
                                task_id: task_id_clone.clone(),
                                line,
                                is_error: false,
                            });
                        }
                        Err(e) => {
                            warn!("Error reading agent stdout: {}", e);
                            break;
                        }
                    }
                }
            });
        }

        // Set up stderr streaming
        let task_id_clone2 = task_id.to_string();
        let app_handle_stderr = app_handle.clone();

        if let Some(stderr) = stderr {
            thread::spawn(move || {
                let reader = BufReader::new(stderr);
                for line in reader.lines() {
                    match line {
                        Ok(line) => {
                            debug!("Agent {} stderr: {}", task_id_clone2, line);

                            // Emit event to frontend
                            let _ = app_handle_stderr.emit("agent-output", AgentOutputEvent {
                                task_id: task_id_clone2.clone(),
                                line,
                                is_error: true,
                            });
                        }
                        Err(e) => {
                            warn!("Error reading agent stderr: {}", e);
                            break;
                        }
                    }
                }
            });
        }

        // Monitor process completion
        let task_id_monitor = task_id.to_string();
        let agents_monitor = Arc::clone(&self.agents);
        let stdin_handles_monitor = Arc::clone(&self.stdin_handles);
        let app_handle_monitor = app_handle;

        thread::spawn(move || {
            // Wait for the child process
            let status = child.wait();

            let new_status = match status {
                Ok(exit_status) => {
                    if exit_status.success() {
                        info!("Agent {} completed successfully", task_id_monitor);
                        TaskAgentStatus::Completed
                    } else {
                        warn!("Agent {} failed with status {:?}", task_id_monitor, exit_status);
                        TaskAgentStatus::Failed
                    }
                }
                Err(e) => {
                    error!("Error waiting for agent {}: {}", task_id_monitor, e);
                    TaskAgentStatus::Failed
                }
            };

            // Update agent status
            if let Ok(mut agents) = agents_monitor.lock() {
                if let Some(agent) = agents.get_mut(&task_id_monitor) {
                    agent.info.status = new_status.clone();
                }
            }

            // Remove stdin handle
            if let Ok(mut handles) = stdin_handles_monitor.lock() {
                handles.remove(&task_id_monitor);
            }

            // Emit status change event
            let _ = app_handle_monitor.emit("agent-status", AgentStatusEvent {
                task_id: task_id_monitor,
                status: new_status,
                message: None,
            });
        });

        // Store agent info
        {
            let mut agents = self.agents.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
            agents.insert(task_id.to_string(), TaskAgentProcess {
                info: info.clone(),
                child: None,
            });
        }

        // Send initial prompt only if this is a new session (not resuming)
        if existing_session_id.is_none() && !initial_prompt.is_empty() {
            self.send_message(task_id, initial_prompt)?;
        }

        Ok(info)
    }

    /// Send a message to a running agent
    pub fn send_message(&self, task_id: &str, message: &str) -> Result<()> {
        info!("Sending message to agent {}: {}", task_id, message);

        let mut handles = self.stdin_handles.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;

        if let Some(stdin) = handles.get_mut(task_id) {
            // Format message as JSON for stream-json input format
            let json_message = serde_json::json!({
                "type": "user",
                "message": {
                    "role": "user",
                    "content": message
                }
            });

            let json_str = json_message.to_string();

            // Persist user message to session file
            append_to_session_file(task_id, &json_str);

            // Also add to in-memory output_lines so it shows in UI immediately
            if let Ok(mut agents) = self.agents.lock() {
                if let Some(agent) = agents.get_mut(task_id) {
                    agent.info.output_lines.push(json_str.clone());
                }
            }

            writeln!(stdin, "{}", json_str)?;
            stdin.flush()?;

            info!("Message sent to agent {}", task_id);
            Ok(())
        } else {
            Err(anyhow::anyhow!("No active session for task {}", task_id))
        }
    }

    /// Stop an agent
    pub fn stop_agent(&self, task_id: &str) -> Result<()> {
        info!("Stopping agent for task {}", task_id);

        // Remove stdin handle first to close the pipe
        {
            let mut handles = self.stdin_handles.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
            handles.remove(task_id);
        }

        let pid = {
            let agents = self.agents.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
            agents.get(task_id).map(|a| a.info.pid)
        };

        if let Some(pid) = pid {
            // Kill the process
            #[cfg(unix)]
            {
                use std::process::Command;
                let _ = Command::new("kill")
                    .args(["-TERM", &pid.to_string()])
                    .output();
            }

            #[cfg(windows)]
            {
                use std::process::Command;
                let _ = Command::new("taskkill")
                    .args(["/PID", &pid.to_string(), "/F"])
                    .output();
            }

            // Update status
            let mut agents = self.agents.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
            if let Some(agent) = agents.get_mut(task_id) {
                agent.info.status = TaskAgentStatus::Stopped;
            }

            info!("Stopped agent {} (PID {})", task_id, pid);
        }

        Ok(())
    }

    /// Get agent info
    pub fn get_agent(&self, task_id: &str) -> Option<TaskAgentInfo> {
        let agents = self.agents.lock().ok()?;
        agents.get(task_id).map(|a| a.info.clone())
    }

    /// Check if agent has an active session (can receive messages)
    pub fn has_active_session(&self, task_id: &str) -> bool {
        let handles = self.stdin_handles.lock().ok();
        handles.map(|h| h.contains_key(task_id)).unwrap_or(false)
    }

    /// List all agents
    pub fn list_agents(&self) -> Vec<TaskAgentInfo> {
        let agents = self.agents.lock().unwrap_or_else(|e| e.into_inner());
        agents.values().map(|a| a.info.clone()).collect()
    }

    /// Cleanup agent (stop and remove worktree)
    pub fn cleanup_agent(&self, task_id: &str, project_path: &str) -> Result<()> {
        info!("Cleaning up agent for task {}", task_id);

        // Stop the agent first
        self.stop_agent(task_id)?;

        // Remove worktree
        let git = GitManager::new(project_path.to_string())?;
        git.remove_worktree(task_id)?;

        // Remove from tracking
        let mut agents = self.agents.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        agents.remove(task_id);

        info!("Cleaned up agent for task {}", task_id);
        Ok(())
    }

    /// Stop all running agents (called on app shutdown)
    pub fn stop_all_agents(&self) {
        info!("Stopping all running agents...");

        // Get all task IDs first to avoid holding locks
        let task_ids: Vec<String> = {
            if let Ok(agents) = self.agents.lock() {
                agents.keys().cloned().collect()
            } else {
                Vec::new()
            }
        };

        for task_id in task_ids {
            if let Err(e) = self.stop_agent(&task_id) {
                warn!("Failed to stop agent {}: {}", task_id, e);
            }
        }

        info!("All agents stopped");
    }

    /// Get agent output - loads from file if not in memory
    pub fn get_agent_output(&self, task_id: &str) -> Option<Vec<String>> {
        // First try to get from memory (active session)
        if let Ok(agents) = self.agents.lock() {
            if let Some(agent) = agents.get(task_id) {
                if !agent.info.output_lines.is_empty() {
                    return Some(agent.info.output_lines.clone());
                }
            }
        }

        // Fall back to loading from session file
        let lines = load_session_file(task_id);
        if !lines.is_empty() {
            Some(lines)
        } else {
            None
        }
    }
}

impl Default for TaskAgentManager {
    fn default() -> Self {
        Self::new()
    }
}

// Global instance for use in commands
lazy_static::lazy_static! {
    pub static ref TASK_AGENT_MANAGER: Arc<Mutex<TaskAgentManager>> = Arc::new(Mutex::new(TaskAgentManager::new()));
}

/// Stop all agents - called on app shutdown
pub fn shutdown_all_agents() {
    info!("App shutdown: stopping all agents");
    if let Ok(manager) = TASK_AGENT_MANAGER.lock() {
        manager.stop_all_agents();
    }
}

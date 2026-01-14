//! Task Agent - Manages Claude Code processes for tasks
//!
//! This module handles spawning and managing Claude Code CLI processes
//! that work on tasks in isolated git worktrees.

use crate::git::GitManager;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};
use tracing::{debug, error, info, warn};

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

        // Create branch name from task ID
        let branch_name = format!("medusa/task-{}", &task_id[..8]);

        // Create git manager and worktree
        let git = GitManager::new(project_path.to_string())?;
        let worktree_path = git.create_worktree(task_id, &branch_name)?;

        info!("Created worktree at {:?} on branch {}", worktree_path, branch_name);

        // Build the Claude command for interactive mode
        let mut cmd = Command::new("claude");
        cmd.args([
            "--verbose",
            "--output-format", "stream-json",
            "--input-format", "stream-json",
            "--dangerously-skip-permissions",
        ])
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
            worktree_path: worktree_path.to_string_lossy().to_string(),
            branch: branch_name,
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

                            // Store output line
                            if let Ok(mut agents) = agents_clone.lock() {
                                if let Some(agent) = agents.get_mut(&task_id_clone) {
                                    agent.info.output_lines.push(line.clone());
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

        // Send initial prompt
        if !initial_prompt.is_empty() {
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

            writeln!(stdin, "{}", json_message.to_string())?;
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

    /// Get agent output
    pub fn get_agent_output(&self, task_id: &str) -> Option<Vec<String>> {
        let agents = self.agents.lock().ok()?;
        agents.get(task_id).map(|a| a.info.output_lines.clone())
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

use anyhow::Result;
use bollard::exec::{CreateExecOptions, StartExecResults};
use bollard::Docker;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tracing::{debug, error, info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalMessage {
    pub message_type: String, // "input", "output", "error", "exit"
    pub data: String,
}

pub struct TerminalSession {
    pub session_id: String,
    pub container_id: String,
    pub tx: mpsc::UnboundedSender<TerminalMessage>,
}

pub struct TerminalManager {
    docker: Docker,
    sessions: Arc<Mutex<HashMap<String, TerminalSession>>>,
}

impl TerminalManager {
    pub fn new(docker: Docker) -> Self {
        Self {
            docker,
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Create a new terminal session for a container
    pub async fn create_session(
        &self,
        session_id: String,
        container_id: String,
    ) -> Result<mpsc::UnboundedReceiver<TerminalMessage>> {
        info!("Creating terminal session {} for container {}", session_id, container_id);

        let (tx, rx) = mpsc::unbounded_channel();

        // Create exec instance with TTY
        let exec_config = CreateExecOptions {
            cmd: Some(vec!["/bin/bash".to_string()]),
            attach_stdin: Some(true),
            attach_stdout: Some(true),
            attach_stderr: Some(true),
            tty: Some(true),
            env: Some(vec!["TERM=xterm-256color".to_string()]),
            ..Default::default()
        };

        let exec = self.docker.create_exec(&container_id, exec_config).await?;

        // Store session
        let session = TerminalSession {
            session_id: session_id.clone(),
            container_id: container_id.clone(),
            tx: tx.clone(),
        };

        {
            let mut sessions = self.sessions.lock().await;
            sessions.insert(session_id.clone(), session);
        }

        // Start exec with streaming
        let docker = self.docker.clone();
        let sessions = Arc::clone(&self.sessions);
        let session_id_clone = session_id.clone();

        tokio::spawn(async move {
            match docker.start_exec(&exec.id, None).await {
                Ok(StartExecResults::Attached { mut output, mut input }) => {
                    info!("Terminal session {} started successfully", session_id_clone);

                    // Handle output stream
                    let tx_output = tx.clone();
                    let output_task = tokio::spawn(async move {
                        while let Some(Ok(msg)) = output.next().await {
                            let content = msg.to_string();
                            if !content.is_empty() {
                                let terminal_msg = TerminalMessage {
                                    message_type: "output".to_string(),
                                    data: content,
                                };
                                if tx_output.send(terminal_msg).is_err() {
                                    break;
                                }
                            }
                        }
                        debug!("Output stream ended for session {}", session_id_clone);
                    });

                    // Wait for streams to complete
                    let _ = tokio::join!(output_task);
                }
                Ok(_) => {
                    warn!("Unexpected exec result type for session {}", session_id_clone);
                }
                Err(e) => {
                    error!("Failed to start exec for session {}: {}", session_id_clone, e);
                    let error_msg = TerminalMessage {
                        message_type: "error".to_string(),
                        data: format!("Failed to start terminal: {}", e),
                    };
                    let _ = tx.send(error_msg);
                }
            }

            // Clean up session
            {
                let mut sessions = sessions.lock().await;
                sessions.remove(&session_id_clone);
            }

            let exit_msg = TerminalMessage {
                message_type: "exit".to_string(),
                data: "Terminal session ended".to_string(),
            };
            let _ = tx.send(exit_msg);
        });

        Ok(rx)
    }

    /// Send input to a terminal session
    pub async fn send_input(&self, session_id: &str, data: &str) -> Result<()> {
        // For now, we'll handle this through the streaming interface
        // In a full implementation, you'd need to maintain the input stream
        // This is a simplified version - for production, you'd want to implement
        // proper bidirectional streaming
        debug!("Input received for session {}: {}", session_id, data);
        Ok(())
    }

    /// Close a terminal session
    pub async fn close_session(&self, session_id: &str) -> Result<()> {
        info!("Closing terminal session: {}", session_id);
        let mut sessions = self.sessions.lock().await;
        if let Some(session) = sessions.remove(session_id) {
            let close_msg = TerminalMessage {
                message_type: "exit".to_string(),
                data: "Session closed by user".to_string(),
            };
            let _ = session.tx.send(close_msg);
        }
        Ok(())
    }

    /// List active sessions
    pub async fn list_sessions(&self) -> Vec<String> {
        let sessions = self.sessions.lock().await;
        sessions.keys().cloned().collect()
    }
}
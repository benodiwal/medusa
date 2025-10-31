use anyhow::Result;
use std::sync::Arc;

use bollard::{
    exec::{CreateExecOptions, StartExecOptions},
    Docker,
};
use futures_util::StreamExt;
use tokio::{io::AsyncWriteExt, sync::mpsc};

pub struct AgentPtySession {
    exec_id: String,
    docker: Docker,
    output_rx: Arc<tokio::sync::Mutex<mpsc::UnboundedReceiver<Vec<u8>>>>,
    input_tx: mpsc::UnboundedSender<Vec<u8>>,
}

impl AgentPtySession {
    pub async fn open(docker: Docker, container_id: &str) -> Result<Self> {
        let exec = docker
            .create_exec(
                container_id,
                CreateExecOptions {
                    cmd: Some(vec!["/bin/bash".to_string()]),
                    attach_stdin: Some(true),
                    attach_stdout: Some(true),
                    attach_stderr: Some(true),
                    tty: Some(true),
                    env: Some(vec!["TERM=xterm-256color".to_string()]),
                    ..Default::default()
                },
            )
            .await?
            .id;

        let hijack = match docker
            .start_exec(
                &exec,
                Some(StartExecOptions {
                    detach: false,
                    tty: true,
                    ..Default::default()
                }),
            )
            .await?
        {
            bollard::exec::StartExecResults::Attached { output, input } => (output, input),
            _ => anyhow::bail!("exec did not attach"),
        };

        let (output_tx, output_rx) = mpsc::unbounded_channel::<Vec<u8>>();
        let (input_tx, mut input_rx) = mpsc::unbounded_channel::<Vec<u8>>();

        // Docker output -> UI
        let mut output_stream = hijack.0;
        tokio::spawn(async move {
            while let Some(item) = output_stream.next().await {
                match item {
                    Ok(bollard::container::LogOutput::StdOut { message })
                    | Ok(bollard::container::LogOutput::StdErr { message }) => {
                        let _ = output_tx.send(message.to_vec());
                    }
                    _ => {}
                }
            }
        });

        // UI input -> Docker stdin
        let mut docker_input = hijack.1;
        tokio::spawn(async move {
            while let Some(data) = input_rx.recv().await {
                if docker_input.write_all(&data).await.is_err() {
                    break;
                }
            }
            let _ = docker_input.shutdown().await;
        });

        Ok(Self {
            exec_id: exec,
            docker: docker.clone(),
            output_rx: Arc::new(tokio::sync::Mutex::new(output_rx)),
            input_tx,
        })
    }

    pub async fn resize(&self, rows: u16, cols: u16) -> Result<()> {
        self.docker.resize_exec(
            &self.exec_id,
            bollard::exec::ResizeExecOptions {
                height: rows,
                width: cols,
            },
        ).await?;
        Ok(())
    }

    pub fn write(&self, data: &[u8]) -> Result<()> {
        self.input_tx.send(data.to_vec())?;
        Ok(())
    }

    pub async fn recv_output(&self) -> Option<Vec<u8>> {
        self.output_rx.lock().await.recv().await
    }

    pub fn try_recv_output(&self) -> Option<Vec<u8>> {
        self.output_rx.try_lock().ok()?.try_recv().ok()
    }
}
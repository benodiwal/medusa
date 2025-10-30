// src-tauri/src/docker/container.rs

use anyhow::Result;
#[allow(deprecated)]
use bollard::container::{
    Config, CreateContainerOptions, RemoveContainerOptions, StartContainerOptions,
    StopContainerOptions,
};
use bollard::exec::{CreateExecOptions, StartExecResults};
use bollard::models::{HostConfig, Mount, MountTypeEnum};
use bollard::Docker;
use futures_util::stream::StreamExt;

pub struct ContainerManager {
    docker: Docker,
}

impl ContainerManager {
    pub fn new() -> Result<Self> {
        let docker = Docker::connect_with_local_defaults()?;
        Ok(Self { docker })
    }

    /// Create container for agent with git repo mounted
    pub async fn create_agent_container(
        &self,
        agent_id: &str,
        branch_name: &str,
        host_repo_path: &str,
    ) -> Result<String> {
        let container_name = format!("medusa-agent-{}", agent_id);

        // Setup mount for host repo (read-only)
        let mount = Mount {
            target: Some("/host/repo".to_string()),
            source: Some(host_repo_path.to_string()),
            typ: Some(MountTypeEnum::BIND),
            read_only: Some(true),
            ..Default::default()
        };

        let host_config = HostConfig {
            mounts: Some(vec![mount]),
            ..Default::default()
        };

        let env = vec![
            format!("AGENT_BRANCH={}", branch_name),
            format!("AGENT_ID={}", agent_id),
        ];

        #[allow(deprecated)]
        let config = Config {
            image: Some("medusa-agent:latest".to_string()),
            env: Some(env),
            working_dir: Some("/workspace".to_string()),
            host_config: Some(host_config),
            ..Default::default()
        };

        #[allow(deprecated)]
        let options = CreateContainerOptions {
            name: container_name.clone(),
            platform: None,
        };

        let response = self.docker.create_container(Some(options), config).await?;

        // Start container
        #[allow(deprecated)]
        self.docker
            .start_container(&response.id, None::<StartContainerOptions<String>>)
            .await?;

        Ok(response.id)
    }

    #[allow(deprecated)]
    pub async fn stop_container(&self, container_id: &str) -> Result<()> {
        self.docker
            .stop_container(container_id, None::<StopContainerOptions>)
            .await?;
        Ok(())
    }

    #[allow(deprecated)]
    pub async fn remove_container(&self, container_id: &str) -> Result<()> {
        let options = RemoveContainerOptions {
            force: true,
            v: true, // Remove volumes
            ..Default::default()
        };

        self.docker
            .remove_container(container_id, Some(options))
            .await?;
        Ok(())
    }

    /// Execute command in container and get output
    pub async fn exec_in_container(&self, container_id: &str, cmd: Vec<&str>) -> Result<String> {
        let exec_config = CreateExecOptions {
            cmd: Some(cmd.iter().map(|s| s.to_string()).collect()),
            attach_stdout: Some(true),
            attach_stderr: Some(true),
            ..Default::default()
        };

        let exec = self.docker.create_exec(container_id, exec_config).await?;

        let mut output = String::new();

        if let StartExecResults::Attached {
            output: mut stream, ..
        } = self.docker.start_exec(&exec.id, None).await?
        {
            while let Some(Ok(msg)) = stream.next().await {
                output.push_str(&msg.to_string());
            }
        }

        Ok(output)
    }

    /// Get container status
    #[allow(deprecated)]
    pub async fn container_status(&self, container_id: &str) -> Result<String> {
        let container = self
            .docker
            .inspect_container(
                container_id,
                None::<bollard::container::InspectContainerOptions>,
            )
            .await?;

        Ok(container
            .state
            .and_then(|s| s.status)
            .map(|status| format!("{:?}", status))
            .unwrap_or_else(|| "unknown".to_string()))
    }

    /// Get container logs (useful for debugging)
    #[allow(deprecated)]
    pub async fn get_logs(&self, container_id: &str) -> Result<String> {
        use bollard::container::LogsOptions;
        use chrono::Local;

        let options = LogsOptions::<String> {
            stdout: true,
            stderr: true,
            timestamps: true,
            tail: "100".to_string(),
            ..Default::default()
        };

        let mut logs = String::new();
        let mut stream = self.docker.logs(container_id, Some(options));

        while let Some(Ok(log)) = stream.next().await {
            let log_line = log.to_string();

            // If the log line doesn't already have a timestamp, add one
            if !log_line.starts_with("20") && !log_line.starts_with("[") {
                let timestamp = Local::now().format("%H:%M:%S%.3f");
                logs.push_str(&format!("[{}] {}", timestamp, log_line));
            } else {
                logs.push_str(&log_line);
            }
        }

        Ok(logs)
    }
}

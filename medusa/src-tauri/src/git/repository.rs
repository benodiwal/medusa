use anyhow::Result;
use std::path::PathBuf;
use std::process::Command;

pub struct GitManager {
    repo_path: String,
}

/// Information about a git worktree
#[derive(Debug, Clone)]
pub struct WorktreeInfo {
    pub path: PathBuf,
    pub branch: String,
    pub is_main: bool,
}

impl GitManager {
    pub fn new(repo_path: String) -> Result<Self> {
        // Verify it's a git repository
        let output = Command::new("git")
            .args(["rev-parse", "--git-dir"])
            .current_dir(&repo_path)
            .output()?;

        if !output.status.success() {
            return Err(anyhow::anyhow!("Not a git repository: {}", repo_path));
        }

        Ok(Self { repo_path })
    }

    pub fn current_branch(&self) -> Result<String> {
        let output = Command::new("git")
            .args(["rev-parse", "--abbrev-ref", "HEAD"])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            return Err(anyhow::anyhow!("Failed to get current branch"));
        }

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    pub fn create_branch(&self, branch_name: &str) -> Result<()> {
        let output = Command::new("git")
            .args(["branch", branch_name])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to create branch: {}", stderr));
        }

        Ok(())
    }

    pub fn checkout(&self, branch_name: &str) -> Result<()> {
        let output = Command::new("git")
            .args(["checkout", branch_name])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to checkout branch: {}", stderr));
        }

        Ok(())
    }

    pub fn merge(&self, source_branch: &str, target_branch: &str) -> Result<()> {
        // Checkout target branch
        self.checkout(target_branch)?;

        // Merge source branch
        let output = Command::new("git")
            .args(["merge", source_branch, "--no-edit"])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Merge failed: {}", stderr));
        }

        Ok(())
    }

    pub fn delete_branch(&self, branch_name: &str) -> Result<()> {
        let output = Command::new("git")
            .args(["branch", "-D", branch_name])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to delete branch: {}", stderr));
        }

        Ok(())
    }

    /// Get the .medusa-worktrees directory path
    fn worktrees_dir(&self) -> PathBuf {
        PathBuf::from(&self.repo_path).join(".medusa-worktrees")
    }

    /// Create a new worktree for a task
    /// Returns the path to the created worktree
    pub fn create_worktree(&self, task_id: &str, branch_name: &str) -> Result<PathBuf> {
        let worktrees_dir = self.worktrees_dir();

        // Create .medusa-worktrees directory if it doesn't exist
        if !worktrees_dir.exists() {
            std::fs::create_dir_all(&worktrees_dir)?;

            // Add to .gitignore if not already there
            let gitignore_path = PathBuf::from(&self.repo_path).join(".gitignore");
            let gitignore_entry = ".medusa-worktrees/";

            if gitignore_path.exists() {
                let content = std::fs::read_to_string(&gitignore_path)?;
                if !content.contains(gitignore_entry) {
                    std::fs::write(&gitignore_path, format!("{}\n{}", content.trim(), gitignore_entry))?;
                }
            } else {
                std::fs::write(&gitignore_path, format!("{}\n", gitignore_entry))?;
            }
        }

        let worktree_path = worktrees_dir.join(task_id);

        // If worktree already exists, just return the path
        if worktree_path.exists() {
            return Ok(worktree_path);
        }

        // Create the worktree with a new branch
        let output = Command::new("git")
            .args(["worktree", "add", "-b", branch_name, worktree_path.to_str().unwrap()])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            // If branch already exists, try without -b flag
            let output = Command::new("git")
                .args(["worktree", "add", worktree_path.to_str().unwrap(), branch_name])
                .current_dir(&self.repo_path)
                .output()?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(anyhow::anyhow!("Failed to create worktree: {}", stderr));
            }
        }

        Ok(worktree_path)
    }

    /// Remove a worktree
    pub fn remove_worktree(&self, task_id: &str) -> Result<()> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Ok(()); // Already removed
        }

        // Remove the worktree
        let output = Command::new("git")
            .args(["worktree", "remove", "--force", worktree_path.to_str().unwrap()])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to remove worktree: {}", stderr));
        }

        Ok(())
    }

    /// List all worktrees for this repository
    pub fn list_worktrees(&self) -> Result<Vec<WorktreeInfo>> {
        let output = Command::new("git")
            .args(["worktree", "list", "--porcelain"])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to list worktrees: {}", stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut worktrees = Vec::new();
        let mut current_path: Option<PathBuf> = None;
        let mut current_branch: Option<String> = None;

        for line in stdout.lines() {
            if line.starts_with("worktree ") {
                // Save previous worktree if complete
                if let (Some(path), Some(branch)) = (current_path.take(), current_branch.take()) {
                    let is_main = path == PathBuf::from(&self.repo_path);
                    worktrees.push(WorktreeInfo { path, branch, is_main });
                }
                current_path = Some(PathBuf::from(line.trim_start_matches("worktree ")));
            } else if line.starts_with("branch ") {
                let branch = line.trim_start_matches("branch refs/heads/").to_string();
                current_branch = Some(branch);
            }
        }

        // Don't forget the last one
        if let (Some(path), Some(branch)) = (current_path, current_branch) {
            let is_main = path == PathBuf::from(&self.repo_path);
            worktrees.push(WorktreeInfo { path, branch, is_main });
        }

        Ok(worktrees)
    }

    /// Get the worktree path for a task
    pub fn get_worktree_path(&self, task_id: &str) -> Option<PathBuf> {
        let worktree_path = self.worktrees_dir().join(task_id);
        if worktree_path.exists() {
            Some(worktree_path)
        } else {
            None
        }
    }

    /// Get diff for a worktree (uncommitted changes)
    pub fn get_worktree_diff(&self, task_id: &str) -> Result<String> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Err(anyhow::anyhow!("Worktree not found"));
        }

        let output = Command::new("git")
            .args(["diff", "HEAD"])
            .current_dir(&worktree_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to get diff: {}", stderr));
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    /// Get list of changed files in a worktree (including new/untracked files)
    pub fn get_worktree_changed_files(&self, task_id: &str) -> Result<Vec<String>> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Err(anyhow::anyhow!("Worktree not found"));
        }

        let mut files = std::collections::HashSet::new();

        // Get modified tracked files
        let output = Command::new("git")
            .args(["diff", "--name-only", "HEAD"])
            .current_dir(&worktree_path)
            .output()?;

        if output.status.success() {
            for line in String::from_utf8_lossy(&output.stdout).lines() {
                if !line.is_empty() {
                    files.insert(line.to_string());
                }
            }
        }

        // Get untracked (new) files
        let output = Command::new("git")
            .args(["ls-files", "--others", "--exclude-standard"])
            .current_dir(&worktree_path)
            .output()?;

        if output.status.success() {
            for line in String::from_utf8_lossy(&output.stdout).lines() {
                if !line.is_empty() {
                    files.insert(line.to_string());
                }
            }
        }

        // Get staged files
        let output = Command::new("git")
            .args(["diff", "--name-only", "--cached"])
            .current_dir(&worktree_path)
            .output()?;

        if output.status.success() {
            for line in String::from_utf8_lossy(&output.stdout).lines() {
                if !line.is_empty() {
                    files.insert(line.to_string());
                }
            }
        }

        let mut result: Vec<String> = files.into_iter().collect();
        result.sort();
        Ok(result)
    }

    /// Commit changes in a worktree
    pub fn commit_worktree(&self, task_id: &str, message: &str) -> Result<()> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Err(anyhow::anyhow!("Worktree not found"));
        }

        // Stage all changes
        let output = Command::new("git")
            .args(["add", "-A"])
            .current_dir(&worktree_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to stage changes: {}", stderr));
        }

        // Commit
        let output = Command::new("git")
            .args(["commit", "-m", message])
            .current_dir(&worktree_path)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Ignore "nothing to commit" error
            if !stderr.contains("nothing to commit") {
                return Err(anyhow::anyhow!("Failed to commit: {}", stderr));
            }
        }

        Ok(())
    }
}

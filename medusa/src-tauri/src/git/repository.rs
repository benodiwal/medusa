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

    /// Get the current HEAD commit hash (full 40-char hash)
    pub fn get_current_commit_hash(&self) -> Result<String> {
        let output = Command::new("git")
            .args(["rev-parse", "HEAD"])
            .current_dir(&self.repo_path)
            .output()?;

        if !output.status.success() {
            return Err(anyhow::anyhow!("Failed to get current commit hash"));
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
            let stdout = String::from_utf8_lossy(&output.stdout);

            // Check if this is a merge conflict
            if stderr.contains("CONFLICT") || stdout.contains("CONFLICT") || stderr.contains("Automatic merge failed") {
                // Get list of conflicting files
                let conflict_files = self.get_conflict_files()?;

                // Abort the merge to leave repo in clean state
                let _ = Command::new("git")
                    .args(["merge", "--abort"])
                    .current_dir(&self.repo_path)
                    .output();

                if conflict_files.is_empty() {
                    return Err(anyhow::anyhow!(
                        "Merge conflict detected. Please resolve conflicts manually:\n\
                        1. cd {}\n\
                        2. git merge {}\n\
                        3. Resolve conflicts in your editor\n\
                        4. git add . && git commit",
                        self.repo_path,
                        source_branch
                    ));
                } else {
                    return Err(anyhow::anyhow!(
                        "Merge conflict in {} file(s):\n  • {}\n\n\
                        Please resolve conflicts manually:\n\
                        1. cd {}\n\
                        2. git merge {}\n\
                        3. Resolve conflicts in your editor\n\
                        4. git add . && git commit",
                        conflict_files.len(),
                        conflict_files.join("\n  • "),
                        self.repo_path,
                        source_branch
                    ));
                }
            }

            return Err(anyhow::anyhow!("Merge failed: {}", stderr));
        }

        Ok(())
    }

    /// Get list of files with merge conflicts
    fn get_conflict_files(&self) -> Result<Vec<String>> {
        let output = Command::new("git")
            .args(["diff", "--name-only", "--diff-filter=U"])
            .current_dir(&self.repo_path)
            .output()?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let files: Vec<String> = stdout
            .lines()
            .filter(|l| !l.is_empty())
            .map(|l| l.to_string())
            .collect();

        Ok(files)
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

    /// Check if a worktree is healthy (not orphaned/corrupted)
    fn is_worktree_healthy(&self, worktree_path: &PathBuf) -> Result<bool> {
        // Check 1: Directory exists
        if !worktree_path.exists() {
            return Ok(false);
        }

        // Check 2: Has .git file (worktrees have a .git file, not directory)
        let git_file = worktree_path.join(".git");
        if !git_file.exists() {
            return Ok(false);
        }

        // Check 3: Can run git status in the worktree
        let output = Command::new("git")
            .args(["status", "--porcelain"])
            .current_dir(worktree_path)
            .output();

        match output {
            Ok(result) => Ok(result.status.success()),
            Err(_) => Ok(false),
        }
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

        // If worktree already exists, verify it's healthy
        if worktree_path.exists() {
            if self.is_worktree_healthy(&worktree_path)? {
                return Ok(worktree_path);
            } else {
                // Worktree is corrupted/orphaned, remove and recreate
                tracing::warn!("Worktree at {:?} is unhealthy, removing and recreating", worktree_path);
                let _ = self.remove_worktree(task_id);
                // Also try to remove directory if it still exists
                if worktree_path.exists() {
                    let _ = std::fs::remove_dir_all(&worktree_path);
                }
            }
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

    /// Get diff for a worktree compared to main branch (all changes for review)
    pub fn get_worktree_diff_vs_main(&self, task_id: &str) -> Result<String> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Err(anyhow::anyhow!("Worktree not found"));
        }

        // Get the main branch name (could be main or master)
        let main_branch = self.get_main_branch_name()?;

        // Use three-dot diff to show changes since branching from main
        let output = Command::new("git")
            .args(["diff", &format!("{}...HEAD", main_branch)])
            .current_dir(&worktree_path)
            .output()?;

        if !output.status.success() {
            // Fallback to simple diff if three-dot doesn't work
            let output = Command::new("git")
                .args(["diff", &main_branch])
                .current_dir(&worktree_path)
                .output()?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(anyhow::anyhow!("Failed to get diff vs main: {}", stderr));
            }

            return Ok(String::from_utf8_lossy(&output.stdout).to_string());
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    /// Get changed files compared to main branch
    pub fn get_worktree_changed_files_vs_main(&self, task_id: &str) -> Result<Vec<String>> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Err(anyhow::anyhow!("Worktree not found"));
        }

        let main_branch = self.get_main_branch_name()?;

        let output = Command::new("git")
            .args(["diff", "--name-only", &format!("{}...HEAD", main_branch)])
            .current_dir(&worktree_path)
            .output()?;

        let mut files: Vec<String> = if output.status.success() {
            String::from_utf8_lossy(&output.stdout)
                .lines()
                .filter(|l| !l.is_empty())
                .map(|l| l.to_string())
                .collect()
        } else {
            Vec::new()
        };

        files.sort();
        Ok(files)
    }

    /// Get ALL changed files compared to a base commit (both committed AND uncommitted)
    /// This shows only changes made in the worktree since it was created from base_commit
    pub fn get_worktree_all_changes_vs_base(&self, task_id: &str, base_commit: Option<&str>) -> Result<Vec<String>> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Err(anyhow::anyhow!("Worktree not found"));
        }

        // Use base_commit if provided, otherwise fall back to main branch
        let base = match base_commit {
            Some(commit) => commit.to_string(),
            None => self.get_main_branch_name()?,
        };

        let mut files = std::collections::HashSet::new();

        // Get all changes (committed + uncommitted) vs the base
        // Using two-dot notation compares working tree directly to base
        let output = Command::new("git")
            .args(["diff", "--name-only", &base])
            .current_dir(&worktree_path)
            .output()?;

        if output.status.success() {
            for line in String::from_utf8_lossy(&output.stdout).lines() {
                if !line.is_empty() {
                    files.insert(line.to_string());
                }
            }
        }

        // Get untracked (new) files - these won't show in git diff
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

        let mut result: Vec<String> = files.into_iter().collect();
        result.sort();
        Ok(result)
    }

    /// Get file diff vs a base commit including both committed AND uncommitted changes
    pub fn get_file_diff_vs_base(&self, task_id: &str, file_path: &str, base_commit: Option<&str>) -> Result<String> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Err(anyhow::anyhow!("Worktree not found"));
        }

        // Use base_commit if provided, otherwise fall back to main branch
        let base = match base_commit {
            Some(commit) => commit.to_string(),
            None => self.get_main_branch_name()?,
        };

        // Use git diff base to compare working tree directly to base commit
        // This includes both committed and uncommitted changes
        let output = Command::new("git")
            .args(["diff", &base, "--", file_path])
            .current_dir(&worktree_path)
            .output()?;

        if output.status.success() && !output.stdout.is_empty() {
            return Ok(String::from_utf8_lossy(&output.stdout).to_string());
        }

        // Check if it's a new file (not in base at all)
        let file_full_path = worktree_path.join(file_path);
        if file_full_path.exists() {
            // Check if file exists in base
            let check_base = Command::new("git")
                .args(["cat-file", "-e", &format!("{}:{}", base, file_path)])
                .current_dir(&worktree_path)
                .output()?;

            if !check_base.status.success() {
                // File doesn't exist in base, show as new file
                let content = std::fs::read_to_string(&file_full_path)?;
                let lines: Vec<&str> = content.lines().collect();
                let diff = format!(
                    "diff --git a/{} b/{}\nnew file mode 100644\n--- /dev/null\n+++ b/{}\n@@ -0,0 +1,{} @@\n{}",
                    file_path,
                    file_path,
                    file_path,
                    lines.len(),
                    lines.iter().map(|l| format!("+{}", l)).collect::<Vec<_>>().join("\n")
                );
                return Ok(diff);
            }
        }

        Ok(String::new())
    }

    /// Get the main branch name (main or master)
    pub fn get_main_branch_name(&self) -> Result<String> {
        // Check if 'main' exists
        let output = Command::new("git")
            .args(["rev-parse", "--verify", "main"])
            .current_dir(&self.repo_path)
            .output()?;

        if output.status.success() {
            return Ok("main".to_string());
        }

        // Check if 'master' exists
        let output = Command::new("git")
            .args(["rev-parse", "--verify", "master"])
            .current_dir(&self.repo_path)
            .output()?;

        if output.status.success() {
            return Ok("master".to_string());
        }

        // Fallback to HEAD~1 or origin/main
        Ok("main".to_string())
    }

    /// Get file diff compared to main branch
    pub fn get_file_diff_vs_main(&self, task_id: &str, file_path: &str) -> Result<String> {
        let worktree_path = self.worktrees_dir().join(task_id);

        if !worktree_path.exists() {
            return Err(anyhow::anyhow!("Worktree not found"));
        }

        let main_branch = self.get_main_branch_name()?;

        let output = Command::new("git")
            .args(["diff", &format!("{}...HEAD", main_branch), "--", file_path])
            .current_dir(&worktree_path)
            .output()?;

        if !output.status.success() {
            // Fallback for new files - show entire file as added
            let file_full_path = worktree_path.join(file_path);
            if file_full_path.exists() {
                let content = std::fs::read_to_string(&file_full_path)?;
                let lines: Vec<&str> = content.lines().collect();
                let diff = format!(
                    "diff --git a/{} b/{}\nnew file mode 100644\n--- /dev/null\n+++ b/{}\n@@ -0,0 +1,{} @@\n{}",
                    file_path,
                    file_path,
                    file_path,
                    lines.len(),
                    lines.iter().map(|l| format!("+{}", l)).collect::<Vec<_>>().join("\n")
                );
                return Ok(diff);
            }
            return Ok(String::new());
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

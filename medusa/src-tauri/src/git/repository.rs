use anyhow::Result;
use git2::Repository;

pub struct GitManager {
    repo_path: String,
}

impl GitManager {
    pub fn new(repo_path: String) -> Result<Self> {
        Repository::open(&repo_path)?;
        Ok(Self { repo_path })
    }

    pub fn current_branch(&self) -> Result<String> {
        let repo = Repository::open(&self.repo_path)?;
        let head = repo.head()?;
        let branch_name = head.shorthand().unwrap_or("main").to_string();
        Ok(branch_name)
    }

    pub fn create_branch(&self, branch_name: &str) -> Result<()> {
        let repo = Repository::open(&self.repo_path)?;
        let head_commit = repo.head()?.peel_to_commit()?;
        repo.branch(branch_name, &head_commit, false)?;
        Ok(())
    }

    pub fn checkout(&self, branch_name: &str) -> Result<()> {
        let repo = Repository::open(&self.repo_path)?;
        let obj = repo.revparse_single(&format!("refs/heads/{}", branch_name))?;
        repo.checkout_tree(&obj, None)?;
        repo.set_head(&format!("refs/heads/{}", branch_name))?;
        Ok(())
    }

    pub fn merge(&self, agent_branch: &str, target_branch: &str) -> Result<()> {
        let repo = Repository::open(&self.repo_path)?;

        // Checkout target branch
        self.checkout(target_branch)?;

        // Find the commits
        let target_commit = repo.head()?.peel_to_commit()?;
        let agent_commit = repo
            .find_branch(agent_branch, git2::BranchType::Local)?
            .get()
            .peel_to_commit()?;

        // Merge
        let mut index = repo.merge_commits(&target_commit, &agent_commit, None)?;

        if index.has_conflicts() {
            return Err(anyhow::anyhow!("Merge conflicts detected"));
        }

        // Write merge commit
        let tree_id = index.write_tree_to(&repo)?;
        let tree = repo.find_tree(tree_id)?;

        repo.commit(
            Some("HEAD"),
            &repo.signature()?,
            &repo.signature()?,
            &format!("Merge branch '{}'", agent_branch),
            &tree,
            &[&target_commit, &agent_commit],
        )?;

        Ok(())
    }

    pub fn delete_branch(&self, branch_name: &str) -> Result<()> {
        let repo = Repository::open(&self.repo_path)?;
        let mut branch = repo.find_branch(branch_name, git2::BranchType::Local)?;
        branch.delete()?;
        Ok(())
    }

    
}

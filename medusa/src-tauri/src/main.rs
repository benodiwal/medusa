// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use medusa_lib::agent::types::AgentConfig;
use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // println!("🚀 Starting Medusa system tests...\n");

    // let repo_path = "/Users/sachin/personal/churnguard".to_string();

    // // Test 1: AppState initialization
    // println!("📋 Test 1: Initializing AppState...");
    // let app_state = match medusa_lib::AppState::new(repo_path.clone()) {
    //     Ok(state) => {
    //         println!("✅ AppState initialized successfully");
    //         state
    //     }
    //     Err(e) => {
    //         println!("❌ Failed to initialize AppState: {}", e);
    //         return Err(e.into());
    //     }
    // };

    // // Test 2: Git Manager functionality
    // println!("\n📋 Test 2: Testing Git Manager...");
    // test_git_manager(&app_state).await?;

    // // Test 3: Container Manager functionality
    // println!("\n📋 Test 3: Testing Container Manager...");
    // test_container_manager(&app_state).await?;

    // // Test 4: Agent Manager functionality
    // println!("\n📋 Test 4: Testing Agent Manager...");
    // test_agent_manager(&app_state).await?;

    // println!("\n🎉 All tests completed successfully!");
    // println!("✨ Medusa system is ready for use");

    // Ok(())

    medusa_lib::run();
    Ok(())
}

async fn test_git_manager(
    _app_state: &medusa_lib::AppState,
) -> Result<(), Box<dyn std::error::Error>> {
    // Since GitManager fields are private, we'll test through public AgentManager methods
    // For now, let's create a separate GitManager for testing
    use medusa_lib::git::GitManager;
    let git_manager = GitManager::new("/Users/sachin/personal/churnguard".to_string())?;

    // Test current branch
    match git_manager.current_branch() {
        Ok(branch) => println!("  ✅ Current branch: {}", branch),
        Err(e) => {
            println!("  ❌ Failed to get current branch: {}", e);
            return Err(e.into());
        }
    }

    // Test branch creation
    let test_branch = "test-medusa-branch";
    match git_manager.create_branch(test_branch) {
        Ok(_) => println!("  ✅ Created test branch: {}", test_branch),
        Err(e) => {
            println!("  ⚠️  Branch creation failed (may already exist): {}", e);
        }
    }

    // Test checkout
    match git_manager.checkout(test_branch) {
        Ok(_) => {
            println!("  ✅ Checked out to test branch");
            // Switch back to main
            let _ = git_manager.checkout("main");
        }
        Err(e) => {
            println!("  ⚠️  Branch checkout failed: {}", e);
        }
    }

    // Cleanup: delete test branch
    match git_manager.delete_branch(test_branch) {
        Ok(_) => println!("  ✅ Cleaned up test branch"),
        Err(e) => println!("  ⚠️  Failed to cleanup test branch: {}", e),
    }

    Ok(())
}

async fn test_container_manager(
    _app_state: &medusa_lib::AppState,
) -> Result<(), Box<dyn std::error::Error>> {
    // Since ContainerManager fields are private, we'll create a separate one for testing
    use medusa_lib::docker::ContainerManager;
    let container_manager = ContainerManager::new()?;

    // Test Docker connection
    println!("  🐳 Testing Docker connection...");

    // Try to create a simple test container
    let test_container_result = container_manager
        .create_agent_container(
            "test-agent",
            "test-branch",
            "/tmp", // Use a safe test path
        )
        .await;

    match test_container_result {
        Ok(container_id) => {
            println!(
                "  ✅ Docker connection successful, container created: {}",
                container_id
            );

            // Test container status
            match container_manager.container_status(&container_id).await {
                Ok(status) => println!("  ✅ Container status: {}", status),
                Err(e) => println!("  ⚠️  Failed to get container status: {}", e),
            }

            // Cleanup: stop and remove container
            let _ = container_manager.stop_container(&container_id).await;
            let _ = container_manager.remove_container(&container_id).await;
            println!("  ✅ Test container cleaned up");
        }
        Err(e) => {
            println!("  ⚠️  Docker test failed (may need Docker image): {}", e);
            println!("  💡 Note: This is expected if 'medusa-agent:latest' image doesn't exist");
        }
    }

    Ok(())
}

async fn test_agent_manager(
    app_state: &medusa_lib::AppState,
) -> Result<(), Box<dyn std::error::Error>> {
    let agent_manager = &app_state.agent_manager;

    // Test agent creation
    println!("  🤖 Testing agent creation...");

    let config = AgentConfig {
        model: "test-model".to_string(),
        temperature: 0.7,
        task_description: "Test task for system validation".to_string(),
    };

    let agent_result = agent_manager.create_agent(config).await;

    match agent_result {
        Ok(agent_id) => {
            println!("  ✅ Agent created successfully: {}", agent_id.0);

            // Test agent retrieval
            if let Some(agent) = agent_manager.get_agent(&agent_id.0).await {
                println!(
                    "  ✅ Agent retrieved: {} (status: {:?})",
                    agent.id.0, agent.status
                );
            } else {
                println!("  ❌ Failed to retrieve created agent");
            }

            // Test agent listing
            let agents = agent_manager.list_agents().await;
            println!("  ✅ Found {} agents in system", agents.len());

            // Wait a moment to let container start
            sleep(Duration::from_secs(2)).await;

            // Test agent stopping
            match agent_manager.stop_agent(&agent_id.0).await {
                Ok(_) => println!("  ✅ Agent stopped successfully"),
                Err(e) => println!("  ⚠️  Failed to stop agent: {}", e),
            }

            // Cleanup agent
            match agent_manager.cleanup_agent(&agent_id.0).await {
                Ok(_) => println!("  ✅ Agent cleaned up successfully"),
                Err(e) => println!("  ⚠️  Failed to cleanup agent: {}", e),
            }
        }
        Err(e) => {
            println!(
                "  ⚠️  Agent creation failed (expected without Docker image): {}",
                e
            );
            println!("  💡 Note: This is expected if Docker/containers aren't available");
        }
    }

    Ok(())
}

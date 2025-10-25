use std::vec;
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn all() -> Vec<Migration> {
    return vec![
        // Initial schema
        Migration {
            version: 1,
            description: "create initial tables",
            sql: "
                                CREATE TABLE agents (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    name TEXT NOT NULL,
                                    model TEXT NOT NULL,
                                    system_prompt TEXT,
                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                                );
                                
                                CREATE TABLE tasks (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    agent_id INTEGER NOT NULL,
                                    description TEXT NOT NULL,
                                    status TEXT NOT NULL,
                                    result TEXT,
                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    completed_at DATETIME,
                                    FOREIGN KEY (agent_id) REFERENCES agents(id)
                                );
                                
                                CREATE TABLE orchestration_runs (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    goal TEXT NOT NULL,
                                    status TEXT NOT NULL,
                                    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    completed_at DATETIME
                                );
                            ",
            kind: MigrationKind::Up,
        },

        // Add agent configurations
        Migration {
            version: 2,
            description: "add agent configurations",
            sql: "
                                CREATE TABLE agent_configs (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    agent_id INTEGER NOT NULL,
                                    config_key TEXT NOT NULL,
                                    config_value TEXT NOT NULL,
                                    FOREIGN KEY (agent_id) REFERENCES agents(id),
                                    UNIQUE(agent_id, config_key)
                                );
                            ",
            kind: MigrationKind::Up,
        },

        // Add execution logs
        Migration {
            version: 3,
            description: "add execution logs",
            sql: "
                                CREATE TABLE execution_logs (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    task_id INTEGER NOT NULL,
                                    log_level TEXT NOT NULL,
                                    message TEXT NOT NULL,
                                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    FOREIGN KEY (task_id) REFERENCES tasks(id)
                                );
                                
                                CREATE INDEX idx_execution_logs_task ON execution_logs(task_id);
                                CREATE INDEX idx_execution_logs_timestamp ON execution_logs(timestamp);
                            ",
            kind: MigrationKind::Up,
        },
    ];
}

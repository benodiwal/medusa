pub struct DatabaseConfig {
    pub url: String,
}

 impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: "sqlite:medusa.db".to_string(),
        }
    }
}
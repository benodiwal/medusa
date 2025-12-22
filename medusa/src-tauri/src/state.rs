/// App state for Medusa Plans
/// Currently minimal - may expand for settings persistence
pub struct AppState {
    // Future: Add settings, annotation state, etc.
}

impl AppState {
    pub fn new() -> Self {
        Self {}
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

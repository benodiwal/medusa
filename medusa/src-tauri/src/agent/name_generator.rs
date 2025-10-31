use rand::{thread_rng, seq::SliceRandom};
use rand::Rng;

// Adjectives that convey personality and characteristics
const ADJECTIVES: &[&str] = &[
    "clever", "swift", "bright", "gentle", "brave", "calm", "eager", "fair",
    "happy", "jolly", "keen", "lively", "merry", "nice", "proud", "quick",
    "sharp", "witty", "bold", "cosmic", "dream", "fancy", "golden", "lucid",
    "magic", "mystic", "noble", "serene", "shiny", "silver", "smooth", "stellar",
    "sunny", "super", "vivid", "warm", "wise", "zen", "peppy", "cozy",
    "dapper", "elegant", "graceful", "humble", "inspired", "joyful", "kind", "luminous",
    "mindful", "peaceful", "radiant", "sincere", "tranquil", "upbeat", "valiant", "zesty"
];

// Nouns - animals, nature, and pleasant things
const NOUNS: &[&str] = &[
    "panda", "otter", "dolphin", "penguin", "koala", "bunny", "kitten", "puppy",
    "falcon", "eagle", "phoenix", "dragon", "griffin", "pegasus", "unicorn", "sphinx",
    "ocean", "river", "mountain", "forest", "meadow", "garden", "breeze", "cloud",
    "moon", "star", "comet", "nebula", "galaxy", "cosmos", "aurora", "sunset",
    "wave", "storm", "thunder", "lightning", "crystal", "diamond", "sapphire", "ruby",
    "dancer", "painter", "writer", "dreamer", "explorer", "pioneer", "guardian", "sage",
    "spark", "flame", "ember", "beacon", "prism", "mirror", "bridge", "compass",
    "melody", "harmony", "rhythm", "symphony", "whisper", "echo", "cascade", "horizon"
];

/// Format: adjective-noun (e.g., "clever-panda", "swift-falcon")
pub fn generate_agent_name() -> String {
    let mut rng = thread_rng();

    let adjective = ADJECTIVES.choose(&mut rng).unwrap_or(&"happy");
    let noun = NOUNS.choose(&mut rng).unwrap_or(&"agent");

    format!("{}-{}", adjective, noun)
}

#[allow(unused)]
pub fn generate_unique_agent_name(existing_names: &[String]) -> String {
    let max_attempts = 100;

    for _ in 0..max_attempts {
        let name = generate_agent_name();
        if !existing_names.contains(&name) {
            return name;
        }
    }

    // Fallback: add a random suffix if we can't find a unique name
    let base_name = generate_agent_name();
    let suffix = thread_rng().gen_range(1000..9999);
    format!("{}-{}", base_name, suffix)
}

#[allow(unused)]
pub fn is_valid_agent_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 50
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
        && !name.starts_with('-')
        && !name.ends_with('-')
}

/// Format: medusa/{agent-name}
pub fn create_branch_name(agent_name: &str) -> String {
    format!("medusa/{}", agent_name)
}

/// Format: medusa-{agent-name}-{short-id}
pub fn create_container_name(agent_name: &str, agent_id: &str) -> String {
    // Take first 8 chars of the UUID for brevity
    let short_id = &agent_id[..8.min(agent_id.len())];
    format!("medusa-{}-{}", agent_name, short_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_agent_name() {
        let name = generate_agent_name();
        assert!(name.contains('-'));
        assert!(is_valid_agent_name(&name));
    }

    #[test]
    fn test_unique_generation() {
        let existing = vec!["clever-panda".to_string()];
        let name = generate_unique_agent_name(&existing);
        assert_ne!(name, "clever-panda");
    }

    #[test]
    fn test_branch_name() {
        let branch = create_branch_name("swift-eagle");
        assert_eq!(branch, "medusa/swift-eagle");
    }

    #[test]
    fn test_container_name() {
        let container = create_container_name("happy-otter", "abc123def456");
        assert_eq!(container, "medusa-happy-otter-abc123de");
    }
}
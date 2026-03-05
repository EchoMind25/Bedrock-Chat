//! Game activity detection module (STUB).
//!
//! This module will provide process enumeration for game activity status
//! in Bedrock Chat. Implementation deferred to Prompt 4.
//!
//! # Privacy Model
//!
//! ProcessInfo.exe_path is stripped to filename only, never transmitted as a full path.
//! No process arguments are captured — arguments may contain tokens, file paths,
//! or other sensitive data that would violate our data minimization principle.
//!
//! All process data stays local on the user's machine. Only the matched game name
//! (from a local allowlist) is shared with the server as the user's activity status.
//! Raw process lists are never transmitted over the network.
//!
//! For COPPA-covered users (under 13), activity detection requires explicit parental
//! opt-in within Family Account settings before any activity data is shared.

use serde::Serialize;

/// Information about a running process, minimized for privacy.
///
/// - `pid`: Process ID (local use only, never transmitted)
/// - `name`: Process display name
/// - `exe_filename`: Executable filename only (e.g., "game.exe"), never the full path
#[derive(Debug, Clone, Serialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub exe_filename: String,
}

/// Returns a list of running processes with privacy-stripped metadata.
///
/// # Privacy guarantees
/// - Full executable paths are reduced to filenames only
/// - Process arguments are never captured
/// - The returned data is intended for local-only game matching
///
/// # Returns
/// Currently returns an empty vec (stub). Full implementation in Prompt 4.
#[tauri::command]
pub fn get_running_processes() -> Vec<ProcessInfo> {
    // STUB: Implementation deferred to Prompt 4.
    // Will use sysinfo crate to enumerate processes with privacy stripping.
    Vec::new()
}

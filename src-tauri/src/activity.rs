//! Game activity detection module.
//!
//! Monitors running processes against a curated allowlist of known games
//! and exposes the current game activity via Tauri commands and events.
//!
//! # Privacy Model
//!
//! - Only the process filename is captured — NO exe path, NO arguments, NO env vars
//! - Process data is LOCAL ONLY unless user explicitly shares
//! - Only matched game names (from allowlist) leave this module
//! - Raw process lists are NEVER transmitted over the network
//! - For COPPA users (<13): activity sharing disabled unless parent opts in
//! - Privacy kill switch: when disabled, polling stops and get_activity() returns None

use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::game_list;

/// Debounce duration: activity change events are emitted at most once per 5 seconds.
const DEBOUNCE_DURATION: Duration = Duration::from_secs(5);

/// Polling interval for process scanning.
const POLL_INTERVAL: Duration = Duration::from_secs(10);

/// Current activity detection state, shared across threads.
#[derive(Debug, Clone, Serialize)]
pub struct ActivityState {
    /// The display name of the detected game, or None if nothing detected.
    pub current_game: Option<String>,
    /// Whether detection is enabled (privacy kill switch).
    pub enabled: bool,
}

impl Default for ActivityState {
    fn default() -> Self {
        Self {
            current_game: None,
            enabled: true,
        }
    }
}

/// Payload emitted via the "activity-changed" Tauri event.
#[derive(Debug, Clone, Serialize)]
pub struct ActivityChangedPayload {
    pub game: Option<String>,
}

/// Managed state wrapper for thread-safe access.
pub struct ManagedActivityState {
    pub inner: Arc<Mutex<ActivityState>>,
    last_emit: Arc<Mutex<Instant>>,
}

impl Default for ManagedActivityState {
    fn default() -> Self {
        Self {
            inner: Arc::new(Mutex::new(ActivityState::default())),
            last_emit: Arc::new(Mutex::new(
                Instant::now() - DEBOUNCE_DURATION, // allow immediate first emit
            )),
        }
    }
}

/// Returns the currently detected game activity, or None.
///
/// If detection is disabled (privacy kill switch), always returns None.
#[tauri::command]
pub fn get_activity(state: tauri::State<'_, ManagedActivityState>) -> Option<String> {
    let guard = state.inner.lock().ok()?;
    if !guard.enabled {
        return None;
    }
    guard.current_game.clone()
}

/// Enable or disable activity detection (privacy kill switch).
///
/// When disabled, the polling loop continues running but skips scanning
/// and `get_activity()` returns None immediately.
#[tauri::command]
pub fn set_activity_detection_enabled(
    enabled: bool,
    state: tauri::State<'_, ManagedActivityState>,
    app: AppHandle,
) {
    if let Ok(mut guard) = state.inner.lock() {
        guard.enabled = enabled;
        if !enabled {
            // Clear current activity when disabling
            guard.current_game = None;
            let _ = app.emit("activity-changed", ActivityChangedPayload { game: None });
        }
    }
}

/// Start the background activity polling loop.
///
/// This spawns an async task that polls running processes every 10 seconds,
/// matches them against the game allowlist, and emits "activity-changed"
/// events when the detected game changes (debounced to 5s).
pub fn start_polling(app: &AppHandle) {
    let app_handle = app.clone();

    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(POLL_INTERVAL).await;

            let state = match app_handle.try_state::<ManagedActivityState>() {
                Some(s) => s,
                None => continue,
            };

            let enabled = state
                .inner
                .lock()
                .map(|g| g.enabled)
                .unwrap_or(false);

            if !enabled {
                continue;
            }

            // Scan processes and find a matching game
            let detected = scan_for_games();

            // Update state and emit event if changed
            let should_emit = {
                let mut guard = match state.inner.lock() {
                    Ok(g) => g,
                    Err(_) => continue,
                };

                if guard.current_game != detected {
                    guard.current_game = detected.clone();
                    true
                } else {
                    false
                }
            };

            if should_emit {
                // Debounce: only emit if enough time has passed
                let can_emit = {
                    let mut last = match state.last_emit.lock() {
                        Ok(l) => l,
                        Err(_) => continue,
                    };
                    if last.elapsed() >= DEBOUNCE_DURATION {
                        *last = Instant::now();
                        true
                    } else {
                        false
                    }
                };

                if can_emit {
                    let _ = app_handle.emit(
                        "activity-changed",
                        ActivityChangedPayload {
                            game: detected,
                        },
                    );
                }
            }
        }
    });
}

/// Scan running processes and return the first matched game display name.
fn scan_for_games() -> Option<String> {
    let processes = get_process_filenames();
    for filename in &processes {
        if let Some(game_name) = game_list::is_known_game(filename) {
            return Some(game_name.to_string());
        }
    }
    None
}

// =============================================================================
// Platform-specific process enumeration
// =============================================================================
// Each platform implementation returns a Vec<String> of process filenames only.
// NO paths, NO arguments — privacy by design.

/// Get a list of running process filenames (platform-dispatched).
fn get_process_filenames() -> Vec<String> {
    platform::list_process_filenames()
}

// ---------------------------------------------------------------------------
// Windows implementation
// ---------------------------------------------------------------------------
#[cfg(target_os = "windows")]
mod platform {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use std::path::Path;

    use windows::Win32::Foundation::{CloseHandle, HANDLE};
    use windows::Win32::System::ProcessStatus::{
        EnumProcesses, GetModuleFileNameExW,
    };
    use windows::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ,
    };

    pub fn list_process_filenames() -> Vec<String> {
        let mut pids = vec![0u32; 2048];
        let mut bytes_returned: u32 = 0;

        let ok = unsafe {
            EnumProcesses(
                pids.as_mut_ptr(),
                (pids.len() * std::mem::size_of::<u32>()) as u32,
                &mut bytes_returned,
            )
        };

        if ok.is_err() {
            return Vec::new();
        }

        let count = bytes_returned as usize / std::mem::size_of::<u32>();
        let mut filenames = Vec::with_capacity(count);

        for &pid in &pids[..count] {
            if pid == 0 {
                continue;
            }
            if let Some(name) = get_process_filename(pid) {
                filenames.push(name);
            }
        }

        filenames
    }

    fn get_process_filename(pid: u32) -> Option<String> {
        let handle: HANDLE = unsafe {
            OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                false,
                pid,
            )
        }
        .ok()?;

        let mut buf = [0u16; 260];
        let len = unsafe {
            GetModuleFileNameExW(Some(handle), None, &mut buf)
        };

        unsafe { let _ = CloseHandle(handle); }

        if len == 0 {
            return None;
        }

        let full_path = OsString::from_wide(&buf[..len as usize]);
        let path = Path::new(&full_path);
        path.file_name()
            .and_then(|n| n.to_str())
            .map(String::from)
    }
}

// ---------------------------------------------------------------------------
// macOS implementation
// ---------------------------------------------------------------------------
#[cfg(target_os = "macos")]
mod platform {
    use sysinfo::System;

    pub fn list_process_filenames() -> Vec<String> {
        let mut sys = System::new();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        sys.processes()
            .values()
            .filter_map(|p| {
                // Only filename, never full path
                let name = p.name().to_string_lossy().to_string();
                if name.is_empty() {
                    None
                } else {
                    Some(name)
                }
            })
            .collect()
    }
}

// ---------------------------------------------------------------------------
// Linux implementation
// ---------------------------------------------------------------------------
#[cfg(target_os = "linux")]
mod platform {
    use std::fs;
    use std::path::Path;

    pub fn list_process_filenames() -> Vec<String> {
        let mut filenames = Vec::new();

        let entries = match fs::read_dir("/proc") {
            Ok(e) => e,
            Err(_) => return filenames,
        };

        for entry in entries.flatten() {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();

            // Only numeric directories (PIDs)
            if !name_str.chars().all(|c| c.is_ascii_digit()) {
                continue;
            }

            let pid_path = entry.path();

            // Try /proc/<pid>/comm first (just the process name, max 16 chars)
            let comm_path = pid_path.join("comm");
            if let Ok(comm) = fs::read_to_string(&comm_path) {
                let trimmed = comm.trim().to_string();
                if !trimmed.is_empty() {
                    filenames.push(trimmed);
                    continue;
                }
            }

            // Fallback: /proc/<pid>/exe symlink → extract filename only
            let exe_path = pid_path.join("exe");
            if let Ok(target) = fs::read_link(&exe_path) {
                if let Some(fname) = Path::new(&target).file_name() {
                    if let Some(s) = fname.to_str() {
                        filenames.push(s.to_string());
                    }
                }
            }
        }

        filenames
    }
}

// ---------------------------------------------------------------------------
// Fallback for unsupported platforms
// ---------------------------------------------------------------------------
#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
mod platform {
    pub fn list_process_filenames() -> Vec<String> {
        Vec::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_activity_state_default() {
        let state = ActivityState::default();
        assert!(state.current_game.is_none());
        assert!(state.enabled);
    }

    #[test]
    fn test_scan_returns_option() {
        // scan_for_games should return Some or None without panicking
        let result = scan_for_games();
        assert!(result.is_some() || result.is_none());
    }
}

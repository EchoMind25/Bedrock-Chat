//! Overlay window management for in-game display.
//!
//! Creates a secondary, always-on-top transparent window that shows
//! voice chat participants, game activity, and online friends.
//!
//! The overlay window:
//! - Never steals keyboard focus from the game
//! - Is toggled via Shift+F1 global hotkey
//! - Skips the taskbar/dock
//! - Loads the /overlay Next.js route

use tauri::{AppHandle, Emitter, Manager, WebviewUrl};

/// Default overlay dimensions.
const OVERLAY_WIDTH: f64 = 320.0;
const OVERLAY_HEIGHT: f64 = 200.0;

/// Overlay window label (must be unique across all Tauri windows).
const OVERLAY_LABEL: &str = "overlay";

/// Show the overlay window. Creates it if it doesn't exist yet.
#[tauri::command]
pub fn show_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
        window.show().map_err(|e| e.to_string())?;
        let _ = app.emit("overlay-visibility", true);
        return Ok(());
    }

    create_overlay_window(&app)?;
    let _ = app.emit("overlay-visibility", true);
    Ok(())
}

/// Hide the overlay window without destroying it.
#[tauri::command]
pub fn hide_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
        window.hide().map_err(|e| e.to_string())?;
        let _ = app.emit("overlay-visibility", false);
    }
    Ok(())
}

/// Toggle overlay visibility. Used by the global hotkey (Shift+F1).
#[tauri::command]
pub fn toggle_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
        let visible = window.is_visible().unwrap_or(false);
        if visible {
            window.hide().map_err(|e| e.to_string())?;
            let _ = app.emit("overlay-visibility", false);
        } else {
            window.show().map_err(|e| e.to_string())?;
            let _ = app.emit("overlay-visibility", true);
        }
    } else {
        create_overlay_window(&app)?;
        let _ = app.emit("overlay-visibility", true);
    }
    Ok(())
}

/// Set the overlay window position (for user drag-to-reposition).
#[tauri::command]
pub fn set_overlay_position(x: i32, y: i32, app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
        window
            .set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Create the overlay window positioned at the bottom-right of the primary monitor.
fn create_overlay_window(app: &AppHandle) -> Result<(), String> {
    // Calculate bottom-right position from primary monitor
    let (pos_x, pos_y) = calculate_bottom_right_position(app);

    let builder = tauri::WebviewWindowBuilder::new(
        app,
        OVERLAY_LABEL,
        WebviewUrl::App("/overlay".into()),
    )
    .title("Bedrock Chat Overlay")
    .inner_size(OVERLAY_WIDTH, OVERLAY_HEIGHT)
    .position(pos_x, pos_y)
    .always_on_top(true)
    .decorations(false)
    .transparent(true)
    .skip_taskbar(true)
    .focused(false)
    .resizable(true)
    .visible(true);

    builder.build().map_err(|e| e.to_string())?;

    Ok(())
}

/// Calculate position for bottom-right corner of primary monitor.
/// Falls back to (960, 600) if monitor info is unavailable.
fn calculate_bottom_right_position(app: &AppHandle) -> (f64, f64) {
    let margin = 20.0;

    if let Some(monitor) = app
        .primary_monitor()
        .ok()
        .flatten()
    {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        let screen_w = size.width as f64 / scale;
        let screen_h = size.height as f64 / scale;

        let x = screen_w - OVERLAY_WIDTH - margin;
        let y = screen_h - OVERLAY_HEIGHT - margin;
        (x, y)
    } else {
        (960.0, 600.0)
    }
}

/// Register the global Shift+F1 hotkey for overlay toggle.
///
/// Must be called during app setup after the global-shortcut plugin is initialized.
pub fn register_overlay_hotkey(app: &AppHandle) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    let app_handle = app.clone();

    app.global_shortcut()
        .on_shortcut("shift+f1", move |_app, _shortcut, event| {
            if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = toggle_overlay(app_handle.clone());
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

mod activity;

use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    webview::PageLoadEvent,
    Manager,
};
use tauri_plugin_updater::UpdaterExt;

/// Run the Tauri application.
///
/// Sets up:
/// - Single instance enforcement (prevents multiple windows)
/// - System tray with show/hide/quit
/// - Native notification support
/// - Shell open (for OAuth and external links)
/// - Auto-updater (check on launch, user-consented install)
/// - Window hidden until DOM ready to prevent FOUC
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    builder
        // Plugin: single instance — prevent multiple app windows
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus the existing window when a second instance is launched
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        // Plugin: native notifications for messages, calls, family alerts
        .plugin(tauri_plugin_notification::init())
        // Plugin: open URLs in default browser (OAuth flows, external links)
        .plugin(tauri_plugin_shell::init())
        // Plugin: auto-updater checks for updates on launch
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Register IPC command handlers
        .invoke_handler(tauri::generate_handler![
            activity::get_running_processes,
        ])
        // Show window after page load to prevent FOUC (window starts hidden)
        .on_page_load(|webview, payload| {
            if payload.event() == PageLoadEvent::Finished {
                let _ = webview.window().show();
            }
        })
        .setup(|app| {
            // --- System Tray ---
            let show_item = MenuItemBuilder::with_id("show", "Show Bedrock Chat")
                .build(app)?;
            let hide_item = MenuItemBuilder::with_id("hide", "Hide")
                .build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit")
                .build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&show_item)
                .item(&hide_item)
                .separator()
                .item(&quit_item)
                .build()?;

            // Tray icon loaded from tauri.conf.json trayIcon.iconPath at build time.
            // Provide a 1x1 transparent fallback for robustness.
            let icon = app
                .default_window_icon()
                .cloned()
                .unwrap_or_else(|| Image::new(&[0, 0, 0, 0], 1, 1));

            TrayIconBuilder::new()
                .icon(icon)
                .tooltip("Bedrock Chat")
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            // --- Auto-updater: check on launch ---
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                check_for_updates(app_handle).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Bedrock Chat");
}

/// Check for application updates on launch.
/// Notifies the user if an update is available — does not auto-install without consent.
async fn check_for_updates(app: tauri::AppHandle) {
    let updater = match app.updater() {
        Ok(updater) => updater,
        Err(e) => {
            eprintln!("Updater not available: {e}");
            return;
        }
    };

    match updater.check().await {
        Ok(Some(update)) => {
            eprintln!(
                "Update available: {} -> {}",
                update.current_version, update.version
            );
            // The updater plugin with dialog mode will show a native prompt.
            // For now, we log availability. The UI can listen to tauri://update-available.
        }
        Ok(None) => {
            eprintln!("App is up to date.");
        }
        Err(e) => {
            // Non-fatal: update check failure should not block the app
            eprintln!("Update check failed: {e}");
        }
    }
}

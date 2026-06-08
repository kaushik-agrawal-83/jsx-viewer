mod commands;

use commands::{OpenedUrls, WatcherMap};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(WatcherMap(Arc::new(Mutex::new(HashMap::new()))))
        .manage(OpenedUrls(Mutex::new(vec![])))
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::watch_file,
            commands::unwatch_file,
            commands::opened_files,
            commands::has_prompted_default,
            commands::set_prompted,
            commands::set_as_default_handler,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                let paths: Vec<String> = urls
                    .iter()
                    .filter_map(|u| u.to_file_path().ok())
                    .map(|p| p.to_string_lossy().into_owned())
                    .collect();
                if paths.is_empty() {
                    return;
                }
                app.state::<OpenedUrls>()
                    .0
                    .lock()
                    .unwrap()
                    .extend(paths.clone());
                app.emit("opened-files", paths).ok();
            }
        });
}

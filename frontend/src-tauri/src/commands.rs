use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::fs;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State};

pub struct WatcherMap(pub Arc<Mutex<HashMap<String, RecommendedWatcher>>>);
pub struct OpenedUrls(pub Mutex<Vec<String>>);

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| {
        if e.kind() == std::io::ErrorKind::InvalidData {
            "File is not valid UTF-8 text".to_string()
        } else {
            e.to_string()
        }
    })
}

#[tauri::command]
pub async fn watch_file(
    app: AppHandle,
    path: String,
    state: State<'_, WatcherMap>,
) -> Result<(), String> {
    let mut map = state.0.lock().map_err(|e| e.to_string())?;
    if map.contains_key(&path) {
        return Ok(());
    }

    let app_handle = app.clone();
    let watch_path = path.clone();
    // last-emit debounce tracking
    let last_emit: Arc<Mutex<Option<Instant>>> = Arc::new(Mutex::new(None));

    let mut watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
        if let Ok(event) = res {
            match event.kind {
                EventKind::Modify(_) => {
                    let now = Instant::now();
                    let mut last = last_emit.lock().unwrap();
                    if last.map(|t| now.duration_since(t) < Duration::from_millis(300)).unwrap_or(false) {
                        return;
                    }
                    *last = Some(now);
                    let _ = app_handle.emit("file-changed", serde_json::json!({ "path": watch_path }));
                }
                EventKind::Remove(_) => {
                    let _ = app_handle.emit("file-deleted", serde_json::json!({ "path": watch_path }));
                }
                _ => {}
            }
        }
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(std::path::Path::new(&path), RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    map.insert(path, watcher);
    Ok(())
}

#[tauri::command]
pub async fn unwatch_file(path: String, state: State<'_, WatcherMap>) -> Result<(), String> {
    let mut map = state.0.lock().map_err(|e| e.to_string())?;
    map.remove(&path); // drop watcher → stops watching
    Ok(())
}

#[tauri::command]
pub fn opened_files(state: State<'_, OpenedUrls>) -> Vec<String> {
    let mut lock = state.0.lock().unwrap();
    let paths = lock.clone();
    lock.clear();
    paths
}

#[tauri::command]
pub fn has_prompted_default(app: AppHandle) -> bool {
    app.path()
        .app_config_dir()
        .map(|d| d.join("default-prompted.flag").exists())
        .unwrap_or(false)
}

#[tauri::command]
pub fn set_prompted(app: AppHandle) -> Result<(), String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(dir.join("default-prompted.flag"), "1").map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_as_default_handler() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // swift -e compiles on the fly — can take 5-30s; must not block the command thread.
        // Requires app to be code-signed and installed in /Applications.
        let script = concat!(
            "import CoreServices; ",
            "LSSetDefaultRoleHandlerForContentType(",
            "\"com.jsx-viewer.jsx-component\" as CFString, ",
            "LSRolesMask.viewer, ",
            "\"com.jsx-viewer.app\" as CFString)"
        )
        .to_string();

        tauri::async_runtime::spawn_blocking(move || {
            let output = std::process::Command::new("swift")
                .args(["-e", &script])
                .output()
                .map_err(|e| format!("swift not available: {e}"))?;
            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                return Err(format!("Failed to set default handler: {stderr}"));
            }
            Ok(())
        })
        .await
        .map_err(|e| e.to_string())?
    }
    #[cfg(not(target_os = "macos"))]
    Err("Setting default handler is only supported on macOS".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[tokio::test]
    async fn read_file_existing() {
        let mut f = NamedTempFile::new().unwrap();
        write!(f, "hello tauri").unwrap();
        let result = read_file(f.path().to_str().unwrap().to_string()).await;
        assert_eq!(result.unwrap(), "hello tauri");
    }

    #[tokio::test]
    async fn read_file_missing() {
        let result = read_file("/tmp/__nonexistent_jsx_viewer_test__".to_string()).await;
        assert!(result.is_err());
    }
}

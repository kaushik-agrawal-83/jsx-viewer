use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::fs;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};

pub struct WatcherMap(pub Arc<Mutex<HashMap<String, RecommendedWatcher>>>);

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
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
            if matches!(event.kind, EventKind::Modify(_)) {
                let now = Instant::now();
                let mut last = last_emit.lock().unwrap();
                if last.map(|t| now.duration_since(t) < Duration::from_millis(300)).unwrap_or(false) {
                    return;
                }
                *last = Some(now);
                let _ = app_handle.emit("file-changed", serde_json::json!({ "path": watch_path }));
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

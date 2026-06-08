import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function useFinderOpen(onPaths: (paths: string[]) => void) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return;

    let unlisten: (() => void) | undefined;

    // Cold start: consume paths buffered before frontend mounted
    void invoke<string[]>('opened_files').then(paths => {
      if (paths.length > 0) onPaths(paths);
    });

    // Warm: files opened while app is already running
    void listen<string[]>('opened-files', e => {
      onPaths(e.payload);
    }).then(fn => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
    // onPaths is stable (useCallback in App) — intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

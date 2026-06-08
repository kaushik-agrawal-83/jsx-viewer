import { useState, useCallback } from 'react';
import type { TranspileError } from '../lib/transpiler';

export interface OpenFile {
  path: string;
  fileName: string;
  source: string;
  status: 'loading' | 'ok' | 'error';
  error?: TranspileError | Error;
}

export interface RecentFile {
  path: string;
  fileName: string;
}

const LS_RECENT = 'openFiles.recent';

function loadRecent(): RecentFile[] {
  try {
    return JSON.parse(localStorage.getItem(LS_RECENT) ?? '[]') as RecentFile[];
  } catch {
    return [];
  }
}

export function useOpenFiles() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(loadRecent);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  const openFromDrop = useCallback((file: File) => {
    const path = file.name;
    setOpenFiles(prev => {
      if (prev.find(f => f.path === path)) return prev;
      return [...prev, { path, fileName: file.name, source: '', status: 'loading' }];
    });
    setActiveFilePath(path);

    const reader = new FileReader();
    reader.onload = () => {
      const source = reader.result as string;
      setOpenFiles(prev =>
        prev.map(f => f.path === path ? { ...f, source, status: 'ok' } : f),
      );
    };
    reader.onerror = () => {
      setOpenFiles(prev =>
        prev.map(f =>
          f.path === path
            ? { ...f, status: 'error', error: new Error('Failed to read file') }
            : f,
        ),
      );
    };
    reader.readAsText(file);
  }, []);

  const close = useCallback((path: string) => {
    setOpenFiles(prev => {
      const file = prev.find(f => f.path === path);
      if (file) {
        setRecentFiles(recent => {
          const next = [
            { path: file.path, fileName: file.fileName },
            ...recent.filter(r => r.path !== path),
          ].slice(0, 10);
          localStorage.setItem(LS_RECENT, JSON.stringify(next));
          return next;
        });
      }
      const remaining = prev.filter(f => f.path !== path);
      setActiveFilePath(cur => {
        if (cur !== path) return cur;
        return remaining.length > 0 ? remaining[remaining.length - 1].path : null;
      });
      return remaining;
    });
  }, []);

  const setFileStatus = useCallback(
    (path: string, status: OpenFile['status'], error?: OpenFile['error']) => {
      setOpenFiles(prev =>
        prev.map(f => f.path === path ? { ...f, status, error } : f),
      );
    },
    [],
  );

  const activeFile = openFiles.find(f => f.path === activeFilePath) ?? null;

  return {
    openFiles,
    recentFiles,
    activeFilePath,
    activeFile,
    openFromDrop,
    close,
    setActiveFilePath,
    setFileStatus,
  };
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { PaneContainer } from './components/Viewer/PaneContainer';
import { ViewerToolbar } from './components/Viewer/ViewerToolbar';
import { useSidebar } from './hooks/useSidebar';
import { useTabs } from './hooks/useTabs';
import { usePanes } from './hooks/usePanes';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAdapter } from './lib/adapter-context';
import type { ErrorInfo } from './components/Viewer/ErrorDisplay';

function App() {
  const adapter = useAdapter();
  const sidebar = useSidebar();
  const {
    tabs,
    activeLeftTab,
    activeRightTab,
    openTab,
    closeTab,
    setActive,
    updateTabStatus,
    migrateTabs,
  } = useTabs();

  const panes = usePanes({
    onEnterSplit: sidebar.collapse,
    onExitSplit: sidebar.expand,
    onMigrateTabs: () => migrateTabs('right', 'left'),
  });

  useKeyboardShortcuts({ toggleSidebar: sidebar.toggle });

  // Viewer drag dim state
  const [viewerDragging, setViewerDragging] = useState(false);
  const viewerDragDepthRef = React.useRef(0);

  // Document title
  const activeFileName = activeLeftTab?.fileName ?? activeRightTab?.fileName ?? null;
  useEffect(() => {
    document.title = activeFileName ? `${activeFileName} — JSX Viewer` : 'JSX Viewer';
  }, [activeFileName]);

  // Tauri native drag-drop: receives full OS paths from Finder
  useEffect(() => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return;
    let unlisten: (() => void) | undefined;
    void import('@tauri-apps/api/event').then(({ listen }) => {
      void listen<{ type: string; paths: string[] }>('tauri://drag-drop', event => {
        if (event.payload.type !== 'drop') return;
        event.payload.paths
          .filter(p => p.endsWith('.jsx') || p.endsWith('.tsx'))
          .forEach(path => {
            const fileName = path.split('/').pop() ?? path;
            void adapter.readFile(path).then(source => {
              openTab(panes.state.focusedPane, path, fileName, source);
            });
          });
      }).then(fn => {
        unlisten = fn;
      });
    });
    return () => { unlisten?.(); };
  }, [adapter, openTab, panes.state.focusedPane]);

  // Watch count (Phase 13 wires real file watching)
  const watchingCount = useMemo(
    () => [...tabs.left, ...tabs.right].filter(t => (t.status as string) === 'watching').length,
    [tabs.left, tabs.right],
  );

  // De-duped file list for sidebar (same file can be open in both panes)
  const openFiles = useMemo(() => {
    const seen = new Set<string>();
    return [...tabs.left, ...tabs.right]
      .filter(t => {
        if (seen.has(t.path)) return false;
        seen.add(t.path);
        return true;
      })
      .map(t => ({
        path: t.path,
        fileName: t.fileName,
        source: t.source ?? '',
        status: (t.status === 'missing' ? 'error' : t.status) as 'ok' | 'error' | 'loading',
        error: t.error,
      }));
  }, [tabs.left, tabs.right]);

  const handleDrop = useCallback(
    (paneId: 'left' | 'right', files: File[]) => {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          openTab(paneId, file.name, file.name, reader.result as string);
        };
        reader.readAsText(file);
      });
    },
    [openTab],
  );

  const handleStatusChange = useCallback(
    (tabId: string, status: 'ok' | 'error', error?: ErrorInfo) => {
      updateTabStatus(tabId, status, status === 'error' ? error : undefined);
    },
    [updateTabStatus],
  );

  const handleTabAdd = useCallback(
    (paneId: 'left' | 'right') => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.jsx,.tsx';
      input.multiple = true;
      input.onchange = () => {
        Array.from(input.files ?? []).forEach(file => {
          const reader = new FileReader();
          reader.onload = () => {
            openTab(paneId, file.name, file.name, reader.result as string);
          };
          reader.readAsText(file);
        });
      };
      input.click();
    },
    [openTab],
  );

  const handleSidebarSelect = useCallback(
    (path: string) => {
      const leftTab = tabs.left.find(t => t.path === path);
      const rightTab = tabs.right.find(t => t.path === path);
      if (leftTab) {
        setActive('left', leftTab.id);
        panes.setFocused('left');
      } else if (rightTab) {
        setActive('right', rightTab.id);
        panes.setFocused('right');
      }
    },
    [tabs.left, tabs.right, setActive, panes],
  );

  const handleSidebarClose = useCallback(
    (path: string) => {
      const tab = [...tabs.left, ...tabs.right].find(t => t.path === path);
      if (tab) closeTab(tab.id);
    },
    [tabs.left, tabs.right, closeTab],
  );

  const handleViewerDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (viewerDragDepthRef.current === 0) setViewerDragging(true);
    viewerDragDepthRef.current += 1;
  }, []);

  const handleViewerDragLeave = useCallback(() => {
    viewerDragDepthRef.current = Math.max(0, viewerDragDepthRef.current - 1);
    if (viewerDragDepthRef.current === 0) setViewerDragging(false);
  }, []);

  const handleViewerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleViewerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setViewerDragging(false);
    viewerDragDepthRef.current = 0;
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-app-bg text-text-primary overflow-hidden">
      {/* Glass toolbar */}
      <header
        className="flex h-[44px] shrink-0 items-center px-4 z-10 border-b"
        style={{
          background: 'rgba(8,8,16,0.80)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <h1 className="text-[18px] font-semibold tracking-wide">⚛ JSX Viewer</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          state={sidebar.state}
          openFiles={openFiles}
          recentFiles={[]}
          activePath={activeLeftTab?.path ?? activeRightTab?.path ?? null}
          onSelect={handleSidebarSelect}
          onClose={handleSidebarClose}
          onDrop={files => handleDrop(panes.state.focusedPane, files)}
          onOpenRecent={() => {}}
          onWidthChange={sidebar.setWidth}
          onToggle={sidebar.toggle}
        />

        {/* Viewer column */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ opacity: viewerDragging ? 0.5 : 1, transition: 'opacity 0.15s' }}
          onDragEnter={handleViewerDragEnter}
          onDragLeave={handleViewerDragLeave}
          onDragOver={handleViewerDragOver}
          onDrop={handleViewerDrop}
        >
          <ViewerToolbar
            mode={panes.state.mode}
            watchingCount={watchingCount}
            onEnterSplit={panes.enterSplit}
            onExitSplit={panes.exitSplit}
          />
          <PaneContainer
            mode={panes.state.mode}
            leftRatio={panes.state.leftRatio}
            focusedPane={panes.state.focusedPane}
            leftTabs={tabs.left}
            rightTabs={tabs.right}
            activeLeftId={activeLeftTab?.id ?? null}
            activeRightId={activeRightTab?.id ?? null}
            onTabSelect={setActive}
            onTabClose={closeTab}
            onTabAdd={handleTabAdd}
            onCloseRightPane={panes.exitSplit}
            onFocusPane={panes.setFocused}
            onRatioChange={panes.setRatio}
            onRatioReset={panes.resetRatio}
            onStatusChange={handleStatusChange}
            onDrop={handleDrop}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

import React, { useCallback } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Preview } from './components/Viewer/Preview';
import { TabStrip } from './components/Viewer/TabStrip';
import { MissingFile } from './components/Viewer/MissingFile';
import { DevSandbox } from './components/DevSandbox';
import { useSidebar } from './hooks/useSidebar';
import { useTabs } from './hooks/useTabs';
import type { ErrorInfo } from './components/Viewer/ErrorDisplay';

function ViewToggle() {
  return (
    <div
      className="flex items-center rounded-lg p-0.5 gap-0.5"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      {(['⊞ Single', '⊟ Split'] as const).map(label => (
        <button
          key={label}
          className="px-3 py-1 rounded-md text-xs font-medium transition-colors text-text-secondary hover:text-text-primary"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function App() {
  const sidebar = useSidebar();
  const {
    tabs,
    activeLeftTab,
    openTab,
    closeTab,
    setActive,
    updateTabStatus,
  } = useTabs();

  const handleDrop = useCallback(
    (files: File[]) => {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          openTab('left', file.name, file.name, reader.result as string);
        };
        reader.readAsText(file);
      });
    },
    [openTab],
  );

  const handleStatusChange = useCallback(
    (status: 'ok' | 'error', error?: ErrorInfo) => {
      if (!activeLeftTab) return;
      updateTabStatus(
        activeLeftTab.id,
        status,
        status === 'error' ? error : undefined,
      );
    },
    [activeLeftTab, updateTabStatus],
  );

  const handleAdd = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jsx,.tsx';
    input.multiple = true;
    input.onchange = () => {
      Array.from(input.files ?? []).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          openTab('left', file.name, file.name, reader.result as string);
        };
        reader.readAsText(file);
      });
    };
    input.click();
  }, [openTab]);

  const activeSource = activeLeftTab?.source ?? null;
  const activeFileName = activeLeftTab?.fileName ?? '';

  return (
    <div className="flex h-screen w-screen flex-col bg-app-bg text-text-primary overflow-hidden">
      {/* Glass toolbar */}
      <header
        className="flex h-[44px] shrink-0 items-center justify-between px-4 z-10 border-b"
        style={{
          background: 'rgba(8,8,16,0.80)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <h1 className="text-[18px] font-semibold tracking-wide">⚛ JSX Viewer</h1>
        <ViewToggle />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          state={sidebar.state}
          openFiles={tabs.left.map(t => ({
            path: t.path,
            fileName: t.fileName,
            source: t.source ?? '',
            status: t.status === 'missing' ? 'error' : t.status,
            error: t.error,
          }))}
          recentFiles={[]}
          activePath={activeLeftTab?.path ?? null}
          onSelect={path => {
            const tab = tabs.left.find(t => t.path === path);
            if (tab) setActive('left', tab.id);
          }}
          onClose={path => {
            const tab = tabs.left.find(t => t.path === path);
            if (tab) closeTab(tab.id);
          }}
          onDrop={handleDrop}
          onOpenRecent={() => {}}
          onWidthChange={sidebar.setWidth}
        />

        {/* Viewer area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-surface">
          {import.meta.env.DEV && tabs.left.length === 0 ? (
            <DevSandbox />
          ) : (
            <>
              <TabStrip
                tabs={tabs.left}
                activeTabId={activeLeftTab?.id ?? null}
                onSelect={id => setActive('left', id)}
                onClose={closeTab}
                onAdd={handleAdd}
              />
              <div className="flex-1 overflow-hidden">
                {activeLeftTab?.status === 'missing' ? (
                  <MissingFile />
                ) : (
                  <Preview
                    source={activeSource}
                    fileName={activeFileName}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

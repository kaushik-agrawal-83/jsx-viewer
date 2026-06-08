import React, { useCallback } from 'react';
import { TabStrip } from './TabStrip';
import { Preview } from './Preview';
import { MissingFile } from './MissingFile';
import type { Tab } from '../../hooks/useTabs';
import type { ErrorInfo } from './ErrorDisplay';

interface Props {
  paneId: 'left' | 'right';
  tabs: Tab[];
  activeTabId: string | null;
  isFocused: boolean;
  showClosePane: boolean;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
  onClosePane: () => void;
  onFocus: () => void;
  onStatusChange: (tabId: string, status: 'ok' | 'error', error?: ErrorInfo) => void;
  onDrop: (files: File[]) => void;
}

export function Pane({
  paneId: _paneId,
  tabs,
  activeTabId,
  isFocused,
  showClosePane,
  onTabSelect,
  onTabClose,
  onTabAdd,
  onClosePane,
  onFocus,
  onStatusChange,
  onDrop,
}: Props) {
  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(
        f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'),
      );
      if (files.length > 0) onDrop(files);
    },
    [onDrop],
  );

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      style={{
        outline: isFocused ? '2px solid rgba(129,140,248,0.35)' : '2px solid transparent',
        outlineOffset: -2,
        minWidth: 0,
      }}
      onClick={onFocus}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={onTabSelect}
        onClose={onTabClose}
        onAdd={onTabAdd}
        showClosePane={showClosePane}
        onClosePane={onClosePane}
      />
      <div className="flex-1 overflow-hidden">
        {activeTab?.status === 'missing' ? (
          <MissingFile />
        ) : (
          <Preview
            source={activeTab?.source ?? null}
            fileName={activeTab?.fileName ?? ''}
            onStatusChange={
              activeTab ? (s, e) => onStatusChange(activeTab.id, s, e) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

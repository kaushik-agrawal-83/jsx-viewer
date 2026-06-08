import { useState, useCallback, useEffect } from 'react';
import { Pane } from './Pane';
import { PaneDivider } from './PaneDivider';
import type { Tab } from '../../hooks/useTabs';
import type { ErrorInfo } from './ErrorDisplay';

interface TabDragState {
  tabId: string;
  sourcePaneId: 'left' | 'right';
}

interface Props {
  mode: 'single' | 'split';
  leftRatio: number;
  focusedPane: 'left' | 'right';
  leftTabs: Tab[];
  rightTabs: Tab[];
  activeLeftId: string | null;
  activeRightId: string | null;
  onTabSelect: (paneId: 'left' | 'right', tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: (paneId: 'left' | 'right') => void;
  onCloseRightPane: () => void;
  onFocusPane: (paneId: 'left' | 'right') => void;
  onRatioChange: (ratio: number) => void;
  onRatioReset: () => void;
  onStatusChange: (tabId: string, status: 'ok' | 'error', error?: ErrorInfo) => void;
  onDrop: (paneId: 'left' | 'right', files: File[]) => void;
  onTabMove: (tabId: string, from: 'left' | 'right', to: 'left' | 'right') => void;
}

export function PaneContainer({
  mode,
  leftRatio,
  focusedPane,
  leftTabs,
  rightTabs,
  activeLeftId,
  activeRightId,
  onTabSelect,
  onTabClose,
  onTabAdd,
  onCloseRightPane,
  onFocusPane,
  onRatioChange,
  onRatioReset,
  onStatusChange,
  onDrop,
  onTabMove,
}: Props) {
  const [tabDrag, setTabDrag] = useState<TabDragState | null>(null);
  const [dropTarget, setDropTarget] = useState<'left' | 'right' | null>(null);

  // Detect tab dragstart bubbling from Tab elements (identified by data-tab-id)
  const handleContainerDragStart = useCallback((e: React.DragEvent) => {
    const tabEl = (e.target as HTMLElement).closest('[data-tab-id]') as HTMLElement | null;
    if (!tabEl) return;
    setTabDrag({
      tabId: tabEl.dataset.tabId!,
      sourcePaneId: tabEl.dataset.paneId as 'left' | 'right',
    });
  }, []);

  // Always-on dragend listener — clears drag state however the drag ends
  useEffect(() => {
    const clear = () => {
      setTabDrag(null);
      setDropTarget(null);
    };
    document.addEventListener('dragend', clear);
    return () => document.removeEventListener('dragend', clear);
  }, []);

  // Accepts a drop onto `to` pane; ignores if same pane or no tab drag active
  const commitDrop = useCallback(
    (e: React.DragEvent, to: 'left' | 'right') => {
      e.preventDefault();
      e.stopPropagation();
      if (!tabDrag || tabDrag.sourcePaneId === to) return;
      onTabMove(tabDrag.tabId, tabDrag.sourcePaneId, to);
      setTabDrag(null);
      setDropTarget(null);
    },
    [tabDrag, onTabMove],
  );

  const handleDragOverPane = useCallback(
    (e: React.DragEvent, paneId: 'left' | 'right') => {
      if (!tabDrag || tabDrag.sourcePaneId === paneId) return;
      e.preventDefault();
      setDropTarget(paneId);
    },
    [tabDrag],
  );

  // Only clear dropTarget when truly leaving the wrapper (not just moving to a child)
  const handleDragLeavePane = useCallback((e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) {
      setDropTarget(null);
    }
  }, []);

  // ─── single mode ──────────────────────────────────────────────────────────
  if (mode === 'single') {
    return (
      <div
        className="flex-1 flex overflow-hidden bg-surface relative"
        onDragStart={handleContainerDragStart}
      >
        <Pane
          paneId="left"
          tabs={leftTabs}
          activeTabId={activeLeftId}
          isFocused={false}
          showClosePane={false}
          onTabSelect={id => onTabSelect('left', id)}
          onTabClose={onTabClose}
          onTabAdd={() => onTabAdd('left')}
          onClosePane={() => {}}
          onFocus={() => onFocusPane('left')}
          onStatusChange={onStatusChange}
          onDrop={files => onDrop('left', files)}
        />

        {/* Split-right drop zone: appears when a tab is being dragged */}
        {tabDrag && (
          <div
            className="absolute inset-y-0 right-0 z-20 flex items-center justify-center"
            style={{ width: '33%' }}
            onDragOver={e => { e.preventDefault(); setDropTarget('right'); }}
            onDragLeave={handleDragLeavePane}
            onDrop={e => commitDrop(e, 'right')}
          >
            {/* Background layer */}
            <div
              className="absolute inset-0 transition-all duration-[120ms]"
              style={{
                background: dropTarget === 'right'
                  ? 'rgba(99,102,241,0.22)'
                  : 'rgba(99,102,241,0.07)',
                borderLeft: dropTarget === 'right'
                  ? '2px dashed #818cf8'
                  : '2px dashed rgba(99,102,241,0.35)',
              }}
            />
            {/* Label */}
            <div
              className="relative flex flex-col items-center gap-2 select-none pointer-events-none transition-colors duration-[120ms]"
              style={{ color: dropTarget === 'right' ? '#a5b4fc' : 'rgba(99,102,241,0.65)' }}
            >
              {/* Split-pane icon */}
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="9" height="18" rx="1.5" />
                <rect x="13" y="3" width="9" height="18" rx="1.5" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>
                SPLIT RIGHT
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── split mode ───────────────────────────────────────────────────────────
  return (
    <div
      className="flex-1 flex overflow-hidden bg-surface"
      onDragStart={handleContainerDragStart}
    >
      {/* Left pane wrapper */}
      <div
        style={{
          flexBasis: `calc(${leftRatio * 100}% - 2px)`,
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          minWidth: 0,
          position: 'relative',
        }}
        onDragOver={e => handleDragOverPane(e, 'left')}
        onDragLeave={handleDragLeavePane}
        onDrop={e => commitDrop(e, 'left')}
      >
        <Pane
          paneId="left"
          tabs={leftTabs}
          activeTabId={activeLeftId}
          isFocused={focusedPane === 'left'}
          showClosePane={false}
          onTabSelect={id => onTabSelect('left', id)}
          onTabClose={onTabClose}
          onTabAdd={() => onTabAdd('left')}
          onClosePane={() => {}}
          onFocus={() => onFocusPane('left')}
          onStatusChange={onStatusChange}
          onDrop={files => onDrop('left', files)}
        />
        {/* Drop overlay when dragging from right pane */}
        {tabDrag?.sourcePaneId === 'right' && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center transition-all duration-[120ms]"
            style={{
              background: dropTarget === 'left'
                ? 'rgba(99,102,241,0.20)'
                : 'rgba(99,102,241,0.05)',
              outline: dropTarget === 'left'
                ? '2px dashed #818cf8'
                : '2px dashed rgba(99,102,241,0.25)',
              outlineOffset: '-2px',
              zIndex: 10,
            }}
          >
            {dropTarget === 'left' && (
              <span
                className="select-none"
                style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}
              >
                MOVE HERE
              </span>
            )}
          </div>
        )}
      </div>

      <PaneDivider onRatioChange={onRatioChange} onReset={onRatioReset} />

      {/* Right pane wrapper */}
      <div
        style={{ flex: 1, overflow: 'hidden', display: 'flex', minWidth: 0, position: 'relative' }}
        onDragOver={e => handleDragOverPane(e, 'right')}
        onDragLeave={handleDragLeavePane}
        onDrop={e => commitDrop(e, 'right')}
      >
        <Pane
          paneId="right"
          tabs={rightTabs}
          activeTabId={activeRightId}
          isFocused={focusedPane === 'right'}
          showClosePane
          onTabSelect={id => onTabSelect('right', id)}
          onTabClose={onTabClose}
          onTabAdd={() => onTabAdd('right')}
          onClosePane={onCloseRightPane}
          onFocus={() => onFocusPane('right')}
          onStatusChange={onStatusChange}
          onDrop={files => onDrop('right', files)}
        />
        {/* Drop overlay when dragging from left pane */}
        {tabDrag?.sourcePaneId === 'left' && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center transition-all duration-[120ms]"
            style={{
              background: dropTarget === 'right'
                ? 'rgba(99,102,241,0.20)'
                : 'rgba(99,102,241,0.05)',
              outline: dropTarget === 'right'
                ? '2px dashed #818cf8'
                : '2px dashed rgba(99,102,241,0.25)',
              outlineOffset: '-2px',
              zIndex: 10,
            }}
          >
            {dropTarget === 'right' && (
              <span
                className="select-none"
                style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}
              >
                MOVE HERE
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

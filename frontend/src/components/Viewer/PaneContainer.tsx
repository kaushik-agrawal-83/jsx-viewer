import { useState, useCallback, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Always-fresh refs — avoids stale closures in the long-lived pointermove/pointerup listeners
  const modeRef = useRef(mode);
  const leftRatioRef = useRef(leftRatio);
  const onTabMoveRef = useRef(onTabMove);
  modeRef.current = mode;
  leftRatioRef.current = leftRatio;
  onTabMoveRef.current = onTabMove;

  // Set on pointerdown over a tab, cleared on pointerup
  const dragStartRef = useRef<{
    tabId: string;
    srcPane: 'left' | 'right';
    startX: number;
    startY: number;
  } | null>(null);

  const handleContainerPointerDown = useCallback((e: React.PointerEvent) => {
    const tabEl = (e.target as HTMLElement).closest('[data-tab-id]') as HTMLElement | null;
    // Don't intercept close-button clicks
    if (!tabEl || (e.target as HTMLElement).closest('button')) return;
    dragStartRef.current = {
      tabId: tabEl.dataset.tabId!,
      srcPane: tabEl.dataset.paneId as 'left' | 'right',
      startX: e.clientX,
      startY: e.clientY,
    };
  }, []);

  // Compute which drop target (if any) the pointer is currently over
  const getDropTarget = useCallback(
    (x: number, y: number, srcPane: 'left' | 'right'): 'left' | 'right' | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      if (y < rect.top || y > rect.bottom) return null;
      if (modeRef.current === 'single') {
        return x >= rect.right - rect.width * 0.33 ? 'right' : null;
      }
      const mid = rect.left + rect.width * leftRatioRef.current;
      const overPane = x < mid ? 'left' : 'right';
      return overPane !== srcPane ? overPane : null;
    },
    [],
  );

  // Mount-once document listeners — state communicated via refs to avoid re-attaching
  useEffect(() => {
    let isDragging = false;

    const onMove = (e: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dist = Math.hypot(e.clientX - start.startX, e.clientY - start.startY);
      if (!isDragging && dist <= 5) return;
      if (!isDragging) {
        isDragging = true;
        setTabDrag({ tabId: start.tabId, sourcePaneId: start.srcPane });
      }
      setDropTarget(getDropTarget(e.clientX, e.clientY, start.srcPane));
    };

    const onUp = (e: PointerEvent) => {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (!isDragging || !start) {
        isDragging = false;
        return;
      }
      isDragging = false;
      const target = getDropTarget(e.clientX, e.clientY, start.srcPane);
      if (target) onTabMoveRef.current(start.tabId, start.srcPane, target);
      setTabDrag(null);
      setDropTarget(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [getDropTarget]);

  // ─── single mode ──────────────────────────────────────────────────────────
  if (mode === 'single') {
    return (
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden bg-surface relative"
        onPointerDown={handleContainerPointerDown}
        style={{ cursor: tabDrag ? 'grabbing' : undefined }}
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

        {/* Split-right drop zone — pointer-events-none since drop is detected via coords */}
        {tabDrag && (
          <div
            className="absolute inset-y-0 right-0 z-20 flex items-center justify-center pointer-events-none"
            style={{ width: '33%' }}
          >
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
            <div
              className="relative flex flex-col items-center gap-2 select-none pointer-events-none transition-colors duration-[120ms]"
              style={{ color: dropTarget === 'right' ? '#a5b4fc' : 'rgba(99,102,241,0.65)' }}
            >
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
      ref={containerRef}
      className="flex-1 flex overflow-hidden bg-surface"
      onPointerDown={handleContainerPointerDown}
      style={{ cursor: tabDrag ? 'grabbing' : undefined }}
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

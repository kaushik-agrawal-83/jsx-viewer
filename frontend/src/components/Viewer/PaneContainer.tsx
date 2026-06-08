import { Pane } from './Pane';
import { PaneDivider } from './PaneDivider';
import type { Tab } from '../../hooks/useTabs';
import type { ErrorInfo } from './ErrorDisplay';

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
}: Props) {
  if (mode === 'single') {
    return (
      <div className="flex-1 flex overflow-hidden bg-surface">
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
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-surface">
      <div
        style={{
          flexBasis: `calc(${leftRatio * 100}% - 2px)`,
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          minWidth: 0,
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
      </div>
      <PaneDivider onRatioChange={onRatioChange} onReset={onRatioReset} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minWidth: 0 }}>
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
      </div>
    </div>
  );
}

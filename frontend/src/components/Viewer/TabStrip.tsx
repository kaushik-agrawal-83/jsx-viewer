import { useRef } from 'react';
import { Tab } from './Tab';
import type { Tab as TabData } from '../../hooks/useTabs';

interface Props {
  tabs: TabData[];
  activeTabId: string | null;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onAdd: () => void;
  showClosePane?: boolean;
  onClosePane?: () => void;
}

export function TabStrip({ tabs, activeTabId, onSelect, onClose, onAdd, showClosePane, onClosePane }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    inputRef.current?.click();
    onAdd();
  };

  return (
    <div
      className="flex items-stretch shrink-0 overflow-x-auto border-b"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.08)',
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map(tab => (
        <Tab
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onSelect={() => onSelect(tab.id)}
          onClose={() => onClose(tab.id)}
        />
      ))}

      <button
        type="button"
        className="px-3 py-2 text-sm shrink-0 transition-colors"
        style={{ color: '#475569' }}
        aria-label="open file"
        onClick={handleAdd}
        onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9')}
        onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
      >
        +
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".jsx,.tsx"
        multiple
        className="hidden"
      />

      {showClosePane && (
        <button
          type="button"
          className="ml-auto px-3 py-2 text-sm shrink-0 transition-colors"
          style={{ color: '#475569' }}
          aria-label="close pane"
          title="Close right pane"
          onClick={onClosePane}
          onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9')}
          onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
        >
          ⊠
        </button>
      )}
    </div>
  );
}

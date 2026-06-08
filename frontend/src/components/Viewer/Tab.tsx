import React from 'react';
import { StatusDot } from '../StatusDot';
import type { Tab as TabData } from '../../hooks/useTabs';

interface Props {
  tab: TabData;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function Tab({ tab, isActive, onSelect, onClose }: Props) {
  const dotStatus =
    tab.status === 'missing'
      ? ('recent' as const)
      : (tab.status as 'ok' | 'error' | 'loading' | 'watching');

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none shrink-0 border-b-2 transition-colors"
      style={{
        borderBottomColor: isActive ? '#818cf8' : 'transparent',
        background: isActive ? 'rgba(15,15,28,1)' : 'transparent',
        minWidth: 0,
        maxWidth: 160,
      }}
      onClick={onSelect}
    >
      <StatusDot status={dotStatus} />
      <span
        className="text-xs font-mono truncate"
        style={{
          maxWidth: 120,
          color: tab.status === 'error' ? '#f87171' : isActive ? '#f1f5f9' : '#94a3b8',
        }}
      >
        {tab.fileName}
      </span>
      <button
        type="button"
        className="ml-auto text-xs shrink-0 transition-colors"
        style={{ color: '#475569' }}
        aria-label="close tab"
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
        onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9')}
        onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
      >
        ×
      </button>
    </div>
  );
}

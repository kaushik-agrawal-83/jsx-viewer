import { useState } from 'react';
import { StatusDot } from '../StatusDot';
import type { DotStatus } from '../StatusDot';

interface Props {
  fileName: string;
  status: DotStatus;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function FileListItem({ fileName, status, isActive, onSelect, onClose }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex items-center gap-2 px-3 py-[6px] rounded-lg cursor-pointer select-none text-sm transition-colors"
      style={isActive ? { background: 'rgba(129,140,248,0.12)' } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {isActive && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 2,
            height: 24,
            background: '#818cf8',
            borderRadius: '0 2px 2px 0',
          }}
        />
      )}
      <StatusDot status={status} />
      <span
        className="flex-1 truncate font-mono text-xs"
        style={{ color: status === 'error' ? '#f87171' : isActive ? '#f1f5f9' : '#94a3b8' }}
      >
        {fileName}
      </span>
      <button
        className="text-xs ml-1 transition-opacity"
        style={{
          color: '#475569',
          opacity: hovered || isActive ? 1 : 0,
        }}
        type="button"
        aria-label="close"
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

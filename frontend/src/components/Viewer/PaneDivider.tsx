import React, { useCallback } from 'react';

interface Props {
  onRatioChange: (ratio: number) => void;
  onReset: () => void;
}

export function PaneDivider({ onRatioChange, onReset }: Props) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const container = (e.currentTarget as HTMLElement).parentElement;
      if (!container) return;

      const onMove = (mv: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0) return;
        onRatioChange((mv.clientX - rect.left) / rect.width);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [onRatioChange],
  );

  return (
    <div
      data-testid="pane-divider"
      style={{
        width: 4,
        flexShrink: 0,
        alignSelf: 'stretch',
        cursor: 'col-resize',
        background: 'rgba(255,255,255,0.08)',
        transition: 'background 0.15s',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={onReset}
      onMouseOver={e => ((e.currentTarget as HTMLDivElement).style.background = '#818cf8')}
      onMouseOut={e =>
        ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)')
      }
    />
  );
}

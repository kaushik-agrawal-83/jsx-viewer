import React, { useCallback } from 'react';

interface Props {
  currentWidth: number;
  onWidthChange: (newWidth: number) => void;
}

export function SidebarHandle({ currentWidth, onWidthChange }: Props) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = currentWidth;

      const onMove = (ev: MouseEvent) => {
        onWidthChange(startWidth + (ev.clientX - startX));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [currentWidth, onWidthChange],
  );

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 3,
        height: '100%',
        cursor: 'col-resize',
        zIndex: 10,
      }}
      onMouseDown={handleMouseDown}
    />
  );
}

import React from 'react';

export function EmptyPane() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(129, 140, 248, 0.10)' }}
      >
        ⚛
      </div>
      <p className="text-text-muted text-sm">Drop a .jsx file to preview</p>
    </div>
  );
}

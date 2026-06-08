import React from 'react';

export function MissingFile() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(248,113,113,0.10)' }}
      >
        ✕
      </div>
      <p className="text-sm" style={{ color: '#475569' }}>
        File not found — drop it here again
      </p>
    </div>
  );
}

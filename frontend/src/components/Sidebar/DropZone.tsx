import React, { useRef, useState } from 'react';

interface Props {
  onDrop: (files: File[]) => void;
}

function isJsxFile(f: File) {
  return f.name.endsWith('.jsx') || f.name.endsWith('.tsx');
}

export function DropZone({ onDrop }: Props) {
  const [highlighted, setHighlighted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setHighlighted(true);
  };

  const handleDragLeave = () => setHighlighted(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHighlighted(false);
    const files = Array.from(e.dataTransfer.files).filter(isJsxFile);
    if (files.length > 0) onDrop(files);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(isJsxFile);
    if (files.length > 0) onDrop(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className="rounded-lg px-3 py-4 flex flex-col items-center gap-1 text-xs select-none"
      style={{
        border: highlighted ? '1.5px dashed #818cf8' : '1.5px dashed rgba(129,140,248,0.35)',
        background: highlighted ? 'rgba(129,140,248,0.08)' : 'transparent',
        color: '#475569',
        cursor: 'pointer',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <span className="text-base">↓</span>
      <span>Drop .jsx here</span>
      <button
        className="mt-1 underline transition-colors"
        style={{ color: '#94a3b8' }}
        type="button"
        onClick={e => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9')}
        onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.color = '#94a3b8')}
      >
        Browse…
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jsx,.tsx"
        multiple
        className="hidden"
        onChange={handleInput}
      />
    </div>
  );
}

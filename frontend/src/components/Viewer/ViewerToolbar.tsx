
interface Props {
  mode: 'single' | 'split';
  watchingCount: number;
  onEnterSplit: () => void;
  onExitSplit: () => void;
}

export function ViewerToolbar({ mode, watchingCount, onEnterSplit, onExitSplit }: Props) {
  const buttons = [
    { label: '⊞ Single', active: mode === 'single', onClick: onExitSplit },
    { label: '⊟ Split', active: mode === 'split', onClick: onEnterSplit },
  ] as const;

  return (
    <div
      className="flex items-center justify-end px-3 shrink-0 border-b gap-3"
      style={{
        height: 40,
        background: 'rgba(8,8,16,0.70)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      {watchingCount > 0 && (
        <span
          style={{
            fontSize: 12,
            color: '#818cf8',
            background: 'rgba(129,140,248,0.12)',
            padding: '2px 8px',
            borderRadius: 99,
          }}
        >
          {watchingCount} watching
        </span>
      )}

      <div
        className="flex items-center rounded-lg p-0.5 gap-0.5"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {buttons.map(btn => (
          <button
            key={btn.label}
            type="button"
            className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
            style={{
              background: btn.active ? 'rgba(129,140,248,0.20)' : 'transparent',
              color: btn.active ? '#818cf8' : '#94a3b8',
            }}
            onClick={btn.onClick}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

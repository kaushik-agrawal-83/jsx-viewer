import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  onClose: () => void;
}

export function DefaultHandlerPrompt({ onClose }: Props) {
  const [setting, setSetting] = useState(false);

  const handleSetDefault = async () => {
    setSetting(true);
    try {
      await invoke('set_as_default_handler');
    } catch {
      // Best-effort — continue regardless
    }
    await invoke('set_prompted').catch(() => {});
    onClose();
  };

  const handleDismiss = async () => {
    await invoke('set_prompted').catch(() => {});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-80 rounded-xl p-6 flex flex-col gap-5"
        style={{
          background: '#0f1117',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-4xl leading-none">⚛</span>
          <h2 className="text-sm font-semibold text-white">
            Open .jsx files with JSX Viewer?
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
            Set JSX Viewer as the default app for .jsx and .tsx files. You can
            change this any time via Finder → Get Info → Open with.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => void handleSetDefault()}
            disabled={setting}
            className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: '#6366f1' }}
          >
            {setting ? 'Setting…' : 'Set as Default'}
          </button>
          <button
            onClick={() => void handleDismiss()}
            disabled={setting}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: '#64748b' }}
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}

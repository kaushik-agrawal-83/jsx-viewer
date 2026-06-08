import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { IOAdapter } from './io-adapter';

export class TauriIOAdapter implements IOAdapter {
  async readFile(path: string): Promise<string> {
    return invoke<string>('read_file', { path });
  }

  async watchFile(path: string, onChange: () => void): Promise<() => void> {
    const unlisten = await listen<{ path: string }>('file-changed', (event) => {
      if (event.payload.path === path) onChange();
    });
    await invoke('watch_file', { path });
    return async () => {
      await invoke('unwatch_file', { path });
      unlisten();
    };
  }

  async unwatchFile(path: string): Promise<void> {
    await invoke('unwatch_file', { path });
  }
}

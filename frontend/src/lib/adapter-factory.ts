import type { IOAdapter } from './io-adapter';
import { WebIOAdapter } from './web-adapter';
import { TauriIOAdapter } from './tauri-adapter';

export function createAdapter(): IOAdapter {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return new TauriIOAdapter();
  }
  return new WebIOAdapter();
}

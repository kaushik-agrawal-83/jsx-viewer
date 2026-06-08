import { describe, it, expect, beforeEach } from 'vitest';
import { WebIOAdapter } from '../web-adapter';

// Dynamic import tested indirectly — check web branch (no __TAURI__)
describe('createAdapter', () => {
  beforeEach(() => {
    // Ensure no __TAURI__ present in jsdom
    if ('__TAURI_INTERNALS__' in window) {
      delete (window as Record<string, unknown>).__TAURI_INTERNALS__;
    }
  });

  it('returns WebIOAdapter when __TAURI__ absent', async () => {
    const { createAdapter } = await import('../adapter-factory');
    const adapter = createAdapter();
    expect(adapter).toBeInstanceOf(WebIOAdapter);
  });
});

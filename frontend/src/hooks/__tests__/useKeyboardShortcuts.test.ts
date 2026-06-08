/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  it('metaKey + b triggers toggleSidebar', () => {
    const toggleSidebar = vi.fn();
    renderHook(() => useKeyboardShortcuts({ toggleSidebar }));
    document.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true, key: 'b' }));
    expect(toggleSidebar).toHaveBeenCalledOnce();
  });

  it('metaKey + other key does not trigger', () => {
    const toggleSidebar = vi.fn();
    renderHook(() => useKeyboardShortcuts({ toggleSidebar }));
    document.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true, key: 'k' }));
    expect(toggleSidebar).not.toHaveBeenCalled();
  });

  it('b without metaKey does not trigger', () => {
    const toggleSidebar = vi.fn();
    renderHook(() => useKeyboardShortcuts({ toggleSidebar }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
    expect(toggleSidebar).not.toHaveBeenCalled();
  });
});

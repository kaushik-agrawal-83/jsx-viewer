/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createLocalStorageMock } from '../../test-utils/localStorage';
import { useTabs } from '../useTabs';
import { AdapterProvider } from '../../lib/adapter-context';
import type { IOAdapter } from '../../lib/io-adapter';

const lsMock = createLocalStorageMock();
vi.stubGlobal('localStorage', lsMock);
beforeEach(() => lsMock.clear());

const mockAdapter: IOAdapter = {
  readFile: vi.fn().mockRejectedValue(new Error('not found')),
  watchFile: vi.fn().mockResolvedValue(() => {}),
  unwatchFile: vi.fn().mockResolvedValue(undefined),
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AdapterProvider, { adapter: mockAdapter, children });

describe('useTabs', () => {
  it('openTab adds to left array', () => {
    const { result } = renderHook(() => useTabs(), { wrapper });
    act(() => result.current.openTab('left', 'foo.jsx', 'foo.jsx', 'src'));
    expect(result.current.tabs.left).toHaveLength(1);
    expect(result.current.tabs.left[0].fileName).toBe('foo.jsx');
  });

  it('openTab same path twice focuses existing, no duplicate', () => {
    const { result } = renderHook(() => useTabs(), { wrapper });
    act(() => result.current.openTab('left', 'foo.jsx', 'foo.jsx', 'src'));
    act(() => result.current.openTab('left', 'foo.jsx', 'foo.jsx', 'src'));
    expect(result.current.tabs.left).toHaveLength(1);
  });

  it('closeTab removes tab; adjacent becomes active', () => {
    const { result } = renderHook(() => useTabs(), { wrapper });
    act(() => result.current.openTab('left', 'a.jsx', 'a.jsx', 'src'));
    act(() => result.current.openTab('left', 'b.jsx', 'b.jsx', 'src'));
    const aId = result.current.tabs.left[0].id;
    const bId = result.current.tabs.left[1].id;
    act(() => result.current.closeTab(aId));
    expect(result.current.tabs.left.find(t => t.id === aId)).toBeUndefined();
    expect(result.current.tabs.activeLeft).toBe(bId);
  });

  it('closeTab last tab sets activeLeft to null', () => {
    const { result } = renderHook(() => useTabs(), { wrapper });
    act(() => result.current.openTab('left', 'a.jsx', 'a.jsx', 'src'));
    const id = result.current.tabs.left[0].id;
    act(() => result.current.closeTab(id));
    expect(result.current.tabs.activeLeft).toBeNull();
  });

  it('updateTabStatus updates tab status', () => {
    const { result } = renderHook(() => useTabs(), { wrapper });
    act(() => result.current.openTab('left', 'a.jsx', 'a.jsx', 'src'));
    const id = result.current.tabs.left[0].id;
    act(() => result.current.updateTabStatus(id, 'ok'));
    expect(result.current.tabs.left[0].status).toBe('ok');
  });

  it('state serialized to localStorage on change', () => {
    const { result } = renderHook(() => useTabs(), { wrapper });
    act(() => result.current.openTab('left', 'x.jsx', 'x.jsx', 'src'));
    const stored = JSON.parse(lsMock.getItem('tabs.left') ?? '[]') as unknown[];
    expect(stored).toHaveLength(1);
  });

  it('restore: hook reads localStorage on mount', () => {
    const stored = [{ id: 'abc', path: 'z.jsx', fileName: 'z.jsx' }];
    lsMock.setItem('tabs.left', JSON.stringify(stored));
    lsMock.setItem('tabs.activeLeft', 'abc');
    const { result } = renderHook(() => useTabs(), { wrapper });
    expect(result.current.tabs.left).toHaveLength(1);
    expect(result.current.tabs.left[0].path).toBe('z.jsx');
  });
});

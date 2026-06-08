/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { createLocalStorageMock } from '../../test-utils/localStorage';
import { usePanes } from '../usePanes';

const lsMock = createLocalStorageMock();
vi.stubGlobal('localStorage', lsMock);
beforeEach(() => lsMock.clear());

describe('usePanes', () => {
  it('default mode is single, ratio is 0.5', () => {
    const { result } = renderHook(() => usePanes());
    expect(result.current.state.mode).toBe('single');
    expect(result.current.state.leftRatio).toBe(0.5);
  });

  it('enterSplit sets mode to split', () => {
    const { result } = renderHook(() => usePanes());
    act(() => result.current.enterSplit());
    expect(result.current.state.mode).toBe('split');
  });

  it('exitSplit sets mode to single', () => {
    const { result } = renderHook(() => usePanes());
    act(() => result.current.enterSplit());
    act(() => result.current.exitSplit());
    expect(result.current.state.mode).toBe('single');
  });

  it('setRatio clamps below 0.3', () => {
    const { result } = renderHook(() => usePanes());
    act(() => result.current.setRatio(0.2));
    expect(result.current.state.leftRatio).toBe(0.3);
  });

  it('setRatio clamps above 0.7', () => {
    const { result } = renderHook(() => usePanes());
    act(() => result.current.setRatio(0.8));
    expect(result.current.state.leftRatio).toBe(0.7);
  });

  it('resetRatio sets to 0.5', () => {
    const { result } = renderHook(() => usePanes());
    act(() => result.current.setRatio(0.6));
    act(() => result.current.resetRatio());
    expect(result.current.state.leftRatio).toBe(0.5);
  });

  it('persists mode and ratio to localStorage', () => {
    const { result } = renderHook(() => usePanes());
    act(() => result.current.enterSplit());
    act(() => result.current.setRatio(0.4));
    expect(localStorage.getItem('panes.mode')).toBe('split');
    expect(localStorage.getItem('panes.leftRatio')).toBe('0.4');
  });

  it('enterSplit calls onEnterSplit callback', () => {
    const onEnterSplit = vi.fn();
    const { result } = renderHook(() => usePanes({ onEnterSplit }));
    act(() => result.current.enterSplit());
    expect(onEnterSplit).toHaveBeenCalledOnce();
  });
});

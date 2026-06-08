/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { createLocalStorageMock } from '../../test-utils/localStorage';
import { useSidebar } from '../useSidebar';

const lsMock = createLocalStorageMock();
vi.stubGlobal('localStorage', lsMock);
beforeEach(() => lsMock.clear());

describe('useSidebar', () => {
  it('default width is 200', () => {
    const { result } = renderHook(() => useSidebar());
    expect(result.current.state.width).toBe(200);
  });

  it('collapse sets collapsed:true; expand reverses', () => {
    const { result } = renderHook(() => useSidebar());
    act(() => result.current.collapse());
    expect(result.current.state.collapsed).toBe(true);
    act(() => result.current.expand());
    expect(result.current.state.collapsed).toBe(false);
  });

  it('width clamped to 140–320', () => {
    const { result } = renderHook(() => useSidebar());
    act(() => result.current.setWidth(50));
    expect(result.current.state.width).toBe(140);
    act(() => result.current.setWidth(999));
    expect(result.current.state.width).toBe(320);
    act(() => result.current.setWidth(250));
    expect(result.current.state.width).toBe(250);
  });

  it('width persisted to localStorage and restored', () => {
    const { result, unmount } = renderHook(() => useSidebar());
    act(() => result.current.setWidth(260));
    unmount();
    const { result: r2 } = renderHook(() => useSidebar());
    expect(r2.current.state.width).toBe(260);
  });

  it('collapsed state persisted to localStorage and restored', () => {
    const { result, unmount } = renderHook(() => useSidebar());
    act(() => result.current.collapse());
    unmount();
    const { result: r2 } = renderHook(() => useSidebar());
    expect(r2.current.state.collapsed).toBe(true);
  });

  it('toggle flips collapsed', () => {
    const { result } = renderHook(() => useSidebar());
    act(() => result.current.toggle());
    expect(result.current.state.collapsed).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.state.collapsed).toBe(false);
  });

  it('hide/show sets hidden flag', () => {
    const { result } = renderHook(() => useSidebar());
    act(() => result.current.hide());
    expect(result.current.state.hidden).toBe(true);
    act(() => result.current.show());
    expect(result.current.state.hidden).toBe(false);
  });
});

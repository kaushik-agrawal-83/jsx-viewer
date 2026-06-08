import { useState, useCallback } from 'react';

export interface SidebarState {
  width: number;
  collapsed: boolean;
  hidden: boolean;
}

const MIN = 140;
const MAX = 320;
const DEFAULT_WIDTH = 200;
const LS_WIDTH = 'sidebar.width';
const LS_COLLAPSED = 'sidebar.collapsed';

function clamp(n: number): number {
  return Math.max(MIN, Math.min(MAX, n));
}

function readStorage(): Pick<SidebarState, 'width' | 'collapsed'> {
  const raw = localStorage.getItem(LS_WIDTH);
  return {
    width: clamp(raw !== null ? Number(raw) : DEFAULT_WIDTH),
    collapsed: localStorage.getItem(LS_COLLAPSED) === 'true',
  };
}

export function useSidebar() {
  const [state, setState] = useState<SidebarState>(() => ({
    ...readStorage(),
    hidden: false,
  }));

  const setWidth = useCallback((n: number) => {
    const w = clamp(n);
    localStorage.setItem(LS_WIDTH, String(w));
    setState(s => ({ ...s, width: w }));
  }, []);

  const collapse = useCallback(() => {
    localStorage.setItem(LS_COLLAPSED, 'true');
    setState(s => ({ ...s, collapsed: true }));
  }, []);

  const expand = useCallback(() => {
    localStorage.setItem(LS_COLLAPSED, 'false');
    setState(s => ({ ...s, collapsed: false }));
  }, []);

  const toggle = useCallback(() => {
    setState(s => {
      const next = !s.collapsed;
      localStorage.setItem(LS_COLLAPSED, String(next));
      return { ...s, collapsed: next };
    });
  }, []);

  const hide = useCallback(() => setState(s => ({ ...s, hidden: true })), []);
  const show = useCallback(() => setState(s => ({ ...s, hidden: false })), []);

  return { state, setWidth, collapse, expand, toggle, hide, show };
}

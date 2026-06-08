import { useState, useCallback } from 'react';

export interface PanesState {
  mode: 'single' | 'split';
  leftRatio: number;
  focusedPane: 'left' | 'right';
  autoCollapsed: boolean;
}

const LS_MODE = 'panes.mode';
const LS_RATIO = 'panes.leftRatio';

function clampRatio(n: number): number {
  return Math.max(0.3, Math.min(0.7, n));
}

function readStorage(): Pick<PanesState, 'mode' | 'leftRatio'> {
  const mode = localStorage.getItem(LS_MODE);
  const ratio = localStorage.getItem(LS_RATIO);
  return {
    mode: mode === 'split' ? 'split' : 'single',
    leftRatio: ratio !== null ? clampRatio(Number(ratio)) : 0.5,
  };
}

interface UsePanesOptions {
  onEnterSplit?: () => void;
  onExitSplit?: () => void;
  onMigrateTabs?: () => void;
}

export function usePanes({ onEnterSplit, onExitSplit, onMigrateTabs }: UsePanesOptions = {}) {
  const [state, setState] = useState<PanesState>(() => ({
    ...readStorage(),
    focusedPane: 'left',
    autoCollapsed: false,
  }));

  const enterSplit = useCallback(() => {
    localStorage.setItem(LS_MODE, 'split');
    onEnterSplit?.();
    setState(s => ({ ...s, mode: 'split', autoCollapsed: true }));
  }, [onEnterSplit]);

  const exitSplit = useCallback(() => {
    localStorage.setItem(LS_MODE, 'single');
    onMigrateTabs?.();
    setState(s => {
      if (s.autoCollapsed) onExitSplit?.();
      return { ...s, mode: 'single', focusedPane: 'left', autoCollapsed: false };
    });
  }, [onMigrateTabs, onExitSplit]);

  const setRatio = useCallback((n: number) => {
    const clamped = clampRatio(n);
    localStorage.setItem(LS_RATIO, String(clamped));
    setState(s => ({ ...s, leftRatio: clamped }));
  }, []);

  const resetRatio = useCallback(() => {
    localStorage.setItem(LS_RATIO, '0.5');
    setState(s => ({ ...s, leftRatio: 0.5 }));
  }, []);

  const setFocused = useCallback((pane: 'left' | 'right') => {
    setState(s => ({ ...s, focusedPane: pane }));
  }, []);

  return { state, enterSplit, exitSplit, setRatio, resetRatio, setFocused };
}

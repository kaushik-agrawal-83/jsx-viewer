import { useState, useCallback, useEffect } from 'react';
import { useAdapter } from '../lib/adapter-context';
import type { ErrorInfo } from '../components/Viewer/ErrorDisplay';

export interface Tab {
  id: string;
  path: string;
  fileName: string;
  paneId: 'left' | 'right';
  status: 'ok' | 'error' | 'loading' | 'missing';
  error?: ErrorInfo;
  source?: string;
}

interface TabsState {
  left: Tab[];
  right: Tab[];
  activeLeft: string | null;
  activeRight: string | null;
}

const LS = {
  left: 'tabs.left',
  right: 'tabs.right',
  activeLeft: 'tabs.activeLeft',
  activeRight: 'tabs.activeRight',
} as const;

type StoredTab = { id: string; path: string; fileName: string; source?: string };

function readLS(): Pick<TabsState, 'activeLeft' | 'activeRight'> & {
  leftPaths: StoredTab[];
  rightPaths: StoredTab[];
} {
  const parse = (key: string) => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]') as StoredTab[];
    } catch {
      return [];
    }
  };
  return {
    leftPaths: parse(LS.left),
    rightPaths: parse(LS.right),
    activeLeft: localStorage.getItem(LS.activeLeft),
    activeRight: localStorage.getItem(LS.activeRight),
  };
}

function saveLS(state: TabsState) {
  const serialize = (tabs: Tab[]) =>
    JSON.stringify(
      tabs.map(t => ({ id: t.id, path: t.path, fileName: t.fileName, source: t.source })),
    );
  localStorage.setItem(LS.left, serialize(state.left));
  localStorage.setItem(LS.right, serialize(state.right));
  if (state.activeLeft) localStorage.setItem(LS.activeLeft, state.activeLeft);
  else localStorage.removeItem(LS.activeLeft);
  if (state.activeRight) localStorage.setItem(LS.activeRight, state.activeRight);
  else localStorage.removeItem(LS.activeRight);
}

function nextActive(tabs: Tab[], closedId: string): string | null {
  const idx = tabs.findIndex(t => t.id === closedId);
  if (idx === -1) return tabs.length > 0 ? tabs[tabs.length - 1].id : null;
  const remaining = tabs.filter(t => t.id !== closedId);
  if (remaining.length === 0) return null;
  return (remaining[idx] ?? remaining[idx - 1]).id;
}

export function useTabs() {
  const adapter = useAdapter();

  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  const [tabs, setTabs] = useState<TabsState>(() => {
    const { leftPaths, rightPaths, activeLeft, activeRight } = readLS();
    const toTab = (t: StoredTab, paneId: 'left' | 'right'): Tab => ({
      ...t,
      paneId,
      // Web mode: source cached in localStorage — mark ready immediately
      // Tauri mode: source undefined until readFile resolves
      status: !isTauri && t.source !== undefined ? 'ok' : 'loading',
    });
    return {
      left: leftPaths.map(t => toTab(t, 'left')),
      right: rightPaths.map(t => toTab(t, 'right')),
      activeLeft,
      activeRight,
    };
  });

  // Session restore: re-read each tab's source from disk (Tauri only)
  // Web mode: source already in state from localStorage cache above
  useEffect(() => {
    const restore = async (tab: Tab) => {
      try {
        const source = await adapter.readFile(tab.path);
        setTabs(s => {
          const pane = tab.paneId === 'left' ? s.left : s.right;
          const updated = pane.map(t =>
            t.id === tab.id ? { ...t, source, status: 'ok' as const } : t,
          );
          return tab.paneId === 'left' ? { ...s, left: updated } : { ...s, right: updated };
        });
      } catch {
        setTabs(s => {
          const pane = tab.paneId === 'left' ? s.left : s.right;
          const updated = pane.map(t =>
            t.id === tab.id ? { ...t, status: 'missing' as const } : t,
          );
          return tab.paneId === 'left' ? { ...s, left: updated } : { ...s, right: updated };
        });
      }
    };

    [...tabs.left, ...tabs.right]
      .filter(t => t.status === 'loading')
      .forEach(t => void restore(t));
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((s: TabsState) => {
    saveLS(s);
    return s;
  }, []);

  const openTab = useCallback(
    (paneId: 'left' | 'right', path: string, fileName: string, source: string) => {
      setTabs(s => {
        const pane = paneId === 'left' ? s.left : s.right;
        const existing = pane.find(t => t.path === path);
        if (existing) {
          const next = {
            ...s,
            ...(paneId === 'left' ? { activeLeft: existing.id } : { activeRight: existing.id }),
          };
          persist(next);
          return next;
        }
        const tab: Tab = {
          id: crypto.randomUUID(),
          path,
          fileName,
          paneId,
          status: 'loading',
          source,
        };
        const newPane = [...pane, tab];
        const next = {
          ...s,
          ...(paneId === 'left'
            ? { left: newPane, activeLeft: tab.id }
            : { right: newPane, activeRight: tab.id }),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs(s => {
        const inLeft = s.left.some(t => t.id === tabId);
        const paneKey = inLeft ? 'left' : 'right';
        const activeKey = inLeft ? 'activeLeft' : 'activeRight';
        const pane = s[paneKey];
        const wasActive = s[activeKey] === tabId;
        const remaining = pane.filter(t => t.id !== tabId);
        const newActive = wasActive ? nextActive(pane, tabId) : s[activeKey];
        const next = { ...s, [paneKey]: remaining, [activeKey]: newActive };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setActive = useCallback(
    (paneId: 'left' | 'right', tabId: string) => {
      setTabs(s => {
        const next = {
          ...s,
          ...(paneId === 'left' ? { activeLeft: tabId } : { activeRight: tabId }),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateTabStatus = useCallback(
    (tabId: string, status: Tab['status'], error?: ErrorInfo) => {
      setTabs(s => {
        const update = (pane: Tab[]) =>
          pane.map(t => (t.id === tabId ? { ...t, status, error } : t));
        return { ...s, left: update(s.left), right: update(s.right) };
      });
    },
    [],
  );

  const updateTabSource = useCallback((tabId: string, source: string) => {
    setTabs(s => {
      const update = (pane: Tab[]) =>
        pane.map(t => (t.id === tabId ? { ...t, source } : t));
      return { ...s, left: update(s.left), right: update(s.right) };
    });
  }, []);

  const moveTab = useCallback(
    (tabId: string, toPaneId: 'left' | 'right') => {
      setTabs(s => {
        const inLeft = s.left.some(t => t.id === tabId);
        const fromPaneId: 'left' | 'right' = inLeft ? 'left' : 'right';
        if (fromPaneId === toPaneId) return s;

        const sourceArr = fromPaneId === 'left' ? s.left : s.right;
        const destArr = toPaneId === 'left' ? s.left : s.right;
        const tab = sourceArr.find(t => t.id === tabId);
        if (!tab) return s;

        const newSource = sourceArr.filter(t => t.id !== tabId);
        const newDest = [...destArr, { ...tab, paneId: toPaneId }];

        const newLeft = fromPaneId === 'left' ? newSource : newDest;
        const newRight = fromPaneId === 'right' ? newSource : newDest;

        const srcActiveKey = fromPaneId === 'left' ? 'activeLeft' : 'activeRight';
        const wasActive = s[srcActiveKey] === tabId;
        const newSrcActive = wasActive
          ? (newSource[newSource.length - 1]?.id ?? null)
          : s[srcActiveKey];

        const next: TabsState = {
          ...s,
          left: newLeft,
          right: newRight,
          activeLeft: fromPaneId === 'left' ? newSrcActive : tabId,
          activeRight: fromPaneId === 'right' ? newSrcActive : tabId,
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const migrateTabs = useCallback((from: 'right', to: 'left') => {
    setTabs(s => {
      const migrated = s[from].map(t => ({ ...t, paneId: to }));
      const next = {
        ...s,
        [to]: [...s[to], ...migrated],
        [from]: [],
        activeLeft: s.activeLeft ?? s.activeRight,
        activeRight: null,
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const activeLeftTab = tabs.left.find(t => t.id === tabs.activeLeft) ?? null;
  const activeRightTab = tabs.right.find(t => t.id === tabs.activeRight) ?? null;

  return {
    tabs,
    activeLeftTab,
    activeRightTab,
    openTab,
    closeTab,
    setActive,
    updateTabStatus,
    updateTabSource,
    moveTab,
    migrateTabs,
  };
}

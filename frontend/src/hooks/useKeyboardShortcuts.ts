import { useEffect } from 'react';

interface Shortcuts {
  toggleSidebar: () => void;
}

export function useKeyboardShortcuts({ toggleSidebar }: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleSidebar]);
}

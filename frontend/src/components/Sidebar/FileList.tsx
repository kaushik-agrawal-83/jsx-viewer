import { FileListItem } from './FileListItem';
import type { DotStatus } from '../StatusDot';

interface OpenEntry {
  path: string;
  fileName: string;
  status: DotStatus;
}

interface RecentEntry {
  path: string;
  fileName: string;
}

interface Props {
  openFiles: OpenEntry[];
  recentFiles: RecentEntry[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onOpenRecent: (path: string) => void;
}

export function FileList({
  openFiles,
  recentFiles,
  activePath,
  onSelect,
  onClose,
  onOpenRecent,
}: Props) {
  return (
    <div>
      {openFiles.length > 0 && (
        <>
          <div className="px-3 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Open</p>
          </div>
          <div className="px-2 space-y-0.5">
            {openFiles.map(f => (
              <FileListItem
                key={f.path}
                fileName={f.fileName}
                status={f.status}
                isActive={f.path === activePath}
                onSelect={() => onSelect(f.path)}
                onClose={() => onClose(f.path)}
              />
            ))}
          </div>
        </>
      )}

      {recentFiles.length > 0 && (
        <>
          <div className="px-3 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Recent
            </p>
          </div>
          <div className="px-2 space-y-0.5">
            {recentFiles.map(f => (
              <FileListItem
                key={f.path}
                fileName={f.fileName}
                status="recent"
                isActive={false}
                onSelect={() => onOpenRecent(f.path)}
                onClose={() => {}}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

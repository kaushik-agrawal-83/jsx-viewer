import React from 'react';
import { FileList } from './FileList';
import { DropZone } from './DropZone';
import { SidebarHandle } from './SidebarHandle';
import { StatusDot } from '../StatusDot';
import type { SidebarState } from '../../hooks/useSidebar';
import type { OpenFile, RecentFile } from '../../hooks/useOpenFiles';

interface Props {
  state: SidebarState;
  openFiles: OpenFile[];
  recentFiles: RecentFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onDrop: (files: File[]) => void;
  onOpenRecent: (path: string) => void;
  onWidthChange: (n: number) => void;
}

export function Sidebar({
  state,
  openFiles,
  recentFiles,
  activePath,
  onSelect,
  onClose,
  onDrop,
  onOpenRecent,
  onWidthChange,
}: Props) {
  if (state.hidden) return null;

  const width = state.collapsed ? 44 : state.width;

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'),
    );
    if (files.length > 0) onDrop(files);
  };

  return (
    <aside
      className="shrink-0 flex flex-col relative border-r overflow-hidden"
      style={{
        width,
        transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {state.collapsed ? (
        <div className="flex flex-col items-center pt-4 gap-3">
          {openFiles.map(f => (
            <div
              key={f.path}
              title={f.fileName}
              className="cursor-pointer"
              onClick={() => onSelect(f.path)}
            >
              <StatusDot status={f.status} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <FileList
              openFiles={openFiles.map(f => ({
                path: f.path,
                fileName: f.fileName,
                status: f.status,
              }))}
              recentFiles={recentFiles}
              activePath={activePath}
              onSelect={onSelect}
              onClose={onClose}
              onOpenRecent={onOpenRecent}
            />
          </div>
          <div className="px-3 pb-4 shrink-0">
            <DropZone onDrop={onDrop} />
          </div>
        </>
      )}

      <SidebarHandle currentWidth={state.width} onWidthChange={onWidthChange} />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
    </aside>
  );
}

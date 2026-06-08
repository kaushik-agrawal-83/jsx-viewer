import React, { useState, useCallback } from 'react';
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

function isJsxFile(f: DataTransferItem) {
  return f.kind === 'file' && (f.type === '' || f.type.includes('javascript') || f.type.includes('text'));
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
  const [dragging, setDragging] = useState(false);
  // Track enter/leave across child elements with a counter
  const [dragDepth, setDragDepth] = useState(0);

  if (state.hidden) return null;

  const width = state.collapsed ? 44 : state.width;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragDepth(d => {
      if (d === 0) setDragging(true);
      return d + 1;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragDepth(d => {
      const next = d - 1;
      if (next <= 0) setDragging(false);
      return Math.max(0, next);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setDragDepth(0);
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'),
    );
    if (files.length > 0) onDrop(files);
  }, [onDrop]);

  return (
    <aside
      className="shrink-0 flex flex-col relative border-r overflow-hidden"
      style={{
        width,
        transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
        background: dragging
          ? 'rgba(129,140,248,0.10)'
          : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderColor: dragging ? '#818cf8' : 'rgba(255,255,255,0.08)',
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full-sidebar drop overlay */}
      {dragging && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            pointerEvents: 'none',
            border: '1.5px dashed #818cf8',
            borderRadius: 0,
          }}
        >
          <span style={{ fontSize: 24, color: '#818cf8' }}>↓</span>
          <span style={{ fontSize: 12, color: '#818cf8' }}>Drop to open</span>
        </div>
      )}

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

import React, { useState, useCallback, useRef } from 'react';
import { PanelLeftOpen, PanelLeftClose, Download } from 'lucide-react';
import { FileList } from './FileList';
import { DropZone } from './DropZone';
import { SidebarHandle } from './SidebarHandle';
import { StatusDot } from '../StatusDot';
import { Tooltip } from '../Tooltip';
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
  onToggle: () => void;
  tauriDragging?: boolean;
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
  onToggle,
  tauriDragging = false,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const isDragging = dragging || tauriDragging;
  const dragDepthRef = useRef(0);
  const browseRef = useRef<HTMLInputElement>(null);

  // Hooks must all appear before any early return
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dragDepthRef.current === 0) setDragging(true);
    dragDepthRef.current += 1;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback(() => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    dragDepthRef.current = 0;
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'),
    );
    if (files.length > 0) onDrop(files);
  }, [onDrop]);

  const handleBrowse = useCallback(() => {
    browseRef.current?.click();
  }, []);

  const handleBrowseChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter(
        f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'),
      );
      if (files.length > 0) onDrop(files);
      e.target.value = '';
    },
    [onDrop],
  );

  if (state.hidden) return null;

  const width = state.collapsed ? 44 : state.width;

  return (
    <aside
      className="shrink-0 flex flex-col relative border-r overflow-hidden"
      style={{
        width,
        transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
        background: isDragging
          ? 'rgba(129,140,248,0.10)'
          : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderColor: isDragging ? '#818cf8' : 'rgba(255,255,255,0.08)',
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full-sidebar drop overlay */}
      {isDragging && (
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
        <div className="flex flex-col items-center py-3 gap-3 flex-1 overflow-hidden">
          <Tooltip content="Expand sidebar  ⌘B">
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={onToggle}
              style={{ color: '#94a3b8', lineHeight: 1 }}
              className="transition-colors hover:text-text-primary"
            >
              <PanelLeftOpen size={16} />
            </button>
          </Tooltip>

          {openFiles.map(f => (
            <Tooltip key={f.path} content={f.fileName}>
              <div className="cursor-pointer" onClick={() => onSelect(f.path)}>
                <StatusDot status={f.status} />
              </div>
            </Tooltip>
          ))}

          <div style={{ marginTop: 'auto' }}>
            <button
              type="button"
              aria-label="Open file"
              title="Open file…"
              onClick={handleBrowse}
              style={{ color: '#94a3b8', lineHeight: 1 }}
              className="transition-colors hover:text-text-primary"
            >
              <Download size={16} />
            </button>
            <input
              ref={browseRef}
              type="file"
              accept=".jsx,.tsx"
              multiple
              className="hidden"
              onChange={handleBrowseChange}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar header — title + collapse button */}
          <div
            className="flex items-center justify-between px-3 shrink-0 border-b"
            style={{ height: 36, borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider select-none"
              style={{ color: '#475569' }}
            >
              Files
            </span>
            <Tooltip content="Collapse sidebar  ⌘B">
              <button
                type="button"
                aria-label="Collapse sidebar"
                onClick={onToggle}
                style={{ color: '#475569', lineHeight: 1 }}
                className="transition-colors hover:text-text-primary"
              >
                <PanelLeftClose size={15} />
              </button>
            </Tooltip>
          </div>

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

import React from 'react';

function App() {
  return (
    <div className="flex h-screen w-screen flex-col bg-app-bg text-text-primary overflow-hidden">
      {/* Glass toolbar */}
      <header className="flex h-[44px] shrink-0 items-center px-4 bg-[rgba(8,8,16,0.80)] backdrop-blur-[12px] border-b border-white/[0.07] z-10">
        <h1 className="text-[18px] font-semibold tracking-wide">⚛ JSX Viewer</h1>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Glass sidebar stub */}
        <aside className="w-[200px] shrink-0 bg-[rgba(255,255,255,0.04)] backdrop-blur-glass border-r border-white/[0.08] relative">
          <div className="p-4 text-text-muted text-sm uppercase tracking-widest font-semibold">
            Open
          </div>
          {/* Decorative gradient blob */}
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-[40px] pointer-events-none" />
        </aside>

        {/* Viewer pane */}
        <main className="flex-1 bg-surface flex items-center justify-center relative">
          <div className="text-text-muted">Drop a .jsx file here to view</div>
        </main>
      </div>
    </div>
  );
}

export default App;

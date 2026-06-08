import type { IOAdapter } from './io-adapter';

export class WebIOAdapter implements IOAdapter {
  private ws: WebSocket | null = null;
  private watchCallbacks = new Map<string, () => void>();

  async readFile(path: string): Promise<string> {
    const res = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) throw new Error(`Failed to read file: ${res.statusText}`);
    const data = (await res.json()) as { content: string };
    return data.content;
  }

  async watchFile(path: string, onChange: () => void): Promise<() => void> {
    this.watchCallbacks.set(path, onChange);
    this.ensureSocket();
    this.ws?.send(JSON.stringify({ type: 'watch', path }));
    return () => this.unwatchFile(path);
  }

  async unwatchFile(path: string): Promise<void> {
    this.watchCallbacks.delete(path);
    this.ws?.send(JSON.stringify({ type: 'unwatch', path }));
  }

  private ensureSocket() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${proto}//${location.host}/api/watch`);
    this.ws.onmessage = (ev: MessageEvent) => {
      const msg = JSON.parse(ev.data as string) as { path: string };
      this.watchCallbacks.get(msg.path)?.();
    };
  }
}

export interface IOAdapter {
  readFile(path: string): Promise<string>;
  watchFile(path: string, onChange: () => void): Promise<() => void>;
  unwatchFile(path: string): Promise<void>;
}

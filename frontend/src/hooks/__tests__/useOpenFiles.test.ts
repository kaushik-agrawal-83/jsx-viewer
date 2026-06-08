/// <reference types="vitest/globals" />
import { renderHook, act, waitFor } from '@testing-library/react';
import { createLocalStorageMock } from '../../test-utils/localStorage';
import { useOpenFiles } from '../useOpenFiles';

const lsMock = createLocalStorageMock();
vi.stubGlobal('localStorage', lsMock);
beforeEach(() => lsMock.clear());

function makeFile(name: string, content: string): File {
  return new File([content], name, { type: 'text/plain' });
}

describe('useOpenFiles', () => {
  it('openFromDrop adds file with loading then ok status', async () => {
    const { result } = renderHook(() => useOpenFiles());
    act(() => result.current.openFromDrop(makeFile('foo.jsx', 'export default () => null')));

    expect(result.current.openFiles[0].status).toBe('loading');

    await waitFor(() => {
      expect(result.current.openFiles[0].status).toBe('ok');
    });
    expect(result.current.openFiles[0].source).toBe('export default () => null');
  });

  it('close moves file to recent list', async () => {
    const { result } = renderHook(() => useOpenFiles());
    act(() => result.current.openFromDrop(makeFile('bar.jsx', 'x')));
    await waitFor(() => expect(result.current.openFiles[0].status).toBe('ok'));

    act(() => result.current.close('bar.jsx'));
    expect(result.current.openFiles).toHaveLength(0);
    expect(result.current.recentFiles[0].fileName).toBe('bar.jsx');
  });

  it('recent list capped at 10', async () => {
    const { result } = renderHook(() => useOpenFiles());

    for (let i = 0; i < 12; i++) {
      act(() => result.current.openFromDrop(makeFile(`file${i}.jsx`, 'x')));
    }
    await waitFor(() =>
      result.current.openFiles.every(f => f.status === 'ok'),
    );

    for (let i = 0; i < 12; i++) {
      act(() => result.current.close(`file${i}.jsx`));
    }

    expect(result.current.recentFiles).toHaveLength(10);
  });
});

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DropZone } from '../DropZone';

function makeDataTransfer(files: File[]) {
  return {
    files,
    items: files.map(f => ({ kind: 'file', type: f.type, getAsFile: () => f })),
    types: ['Files'],
  };
}

describe('DropZone', () => {
  it('renders drop hint text', () => {
    render(<DropZone onDrop={() => {}} />);
    expect(screen.getByText(/Drop .jsx here/i)).toBeInTheDocument();
  });

  it('onDragOver with jsx file adds highlight', () => {
    const { container } = render(<DropZone onDrop={() => {}} />);
    const zone = container.firstChild as HTMLElement;
    const jsxFile = new File([''], 'test.jsx');
    fireEvent.dragOver(zone, { dataTransfer: makeDataTransfer([jsxFile]) });
    expect(zone.style.background).toContain('129');
  });

  it('onDrop with non-jsx file does not call onDrop', () => {
    const spy = vi.fn();
    const { container } = render(<DropZone onDrop={spy} />);
    const zone = container.firstChild as HTMLElement;
    const txtFile = new File([''], 'readme.txt');
    fireEvent.drop(zone, { dataTransfer: makeDataTransfer([txtFile]) });
    expect(spy).not.toHaveBeenCalled();
  });

  it('onDrop with jsx file calls onDrop', () => {
    const spy = vi.fn();
    const { container } = render(<DropZone onDrop={spy} />);
    const zone = container.firstChild as HTMLElement;
    const jsxFile = new File([''], 'comp.jsx');
    fireEvent.drop(zone, { dataTransfer: makeDataTransfer([jsxFile]) });
    expect(spy).toHaveBeenCalledWith([jsxFile]);
  });
});

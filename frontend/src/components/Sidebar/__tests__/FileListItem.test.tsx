/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileListItem } from '../FileListItem';

describe('FileListItem', () => {
  it('renders fileName', () => {
    render(
      <FileListItem
        fileName="app.jsx"
        status="ok"
        isActive={false}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('app.jsx')).toBeInTheDocument();
  });

  it('status=error gives red color to filename', () => {
    render(
      <FileListItem
        fileName="broken.jsx"
        status="error"
        isActive={false}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    const name = screen.getByText('broken.jsx');
    expect(name.style.color).toBe('rgb(248, 113, 113)');
  });

  it('× click calls onClose', () => {
    const spy = vi.fn();
    render(
      <FileListItem
        fileName="file.jsx"
        status="ok"
        isActive={true}
        onSelect={() => {}}
        onClose={spy}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(spy).toHaveBeenCalledOnce();
  });
});

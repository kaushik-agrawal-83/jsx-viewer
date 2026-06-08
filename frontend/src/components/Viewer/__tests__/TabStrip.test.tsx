/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TabStrip } from '../TabStrip';
import type { Tab } from '../../../hooks/useTabs';

function makeTab(id: string, fileName: string): Tab {
  return { id, path: fileName, fileName, paneId: 'left', status: 'ok', source: '' };
}

describe('TabStrip', () => {
  it('renders tab for each entry', () => {
    const tabs = [makeTab('1', 'a.jsx'), makeTab('2', 'b.jsx')];
    render(
      <TabStrip tabs={tabs} activeTabId="1" onSelect={() => {}} onClose={() => {}} onAdd={() => {}} />,
    );
    expect(screen.getByText('a.jsx')).toBeInTheDocument();
    expect(screen.getByText('b.jsx')).toBeInTheDocument();
  });

  it('click tab calls onSelect with tabId', () => {
    const spy = vi.fn();
    const tabs = [makeTab('1', 'a.jsx')];
    render(
      <TabStrip tabs={tabs} activeTabId={null} onSelect={spy} onClose={() => {}} onAdd={() => {}} />,
    );
    fireEvent.click(screen.getByText('a.jsx'));
    expect(spy).toHaveBeenCalledWith('1');
  });

  it('click × calls onClose with tabId', () => {
    const spy = vi.fn();
    const tabs = [makeTab('1', 'a.jsx')];
    render(
      <TabStrip tabs={tabs} activeTabId="1" onSelect={() => {}} onClose={spy} onAdd={() => {}} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /close tab/i }));
    expect(spy).toHaveBeenCalledWith('1');
  });

  it('+ button is present', () => {
    render(
      <TabStrip tabs={[]} activeTabId={null} onSelect={() => {}} onClose={() => {}} onAdd={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /open file/i })).toBeInTheDocument();
  });
});

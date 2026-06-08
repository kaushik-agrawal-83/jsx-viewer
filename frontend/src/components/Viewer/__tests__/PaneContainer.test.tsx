/// <reference types="vitest/globals" />
import { render } from '@testing-library/react';
import { PaneContainer } from '../PaneContainer';

const baseProps = {
  leftTabs: [],
  rightTabs: [],
  activeLeftId: null,
  activeRightId: null,
  focusedPane: 'left' as const,
  leftRatio: 0.5,
  onTabSelect: () => {},
  onTabClose: () => {},
  onTabAdd: () => {},
  onCloseRightPane: () => {},
  onFocusPane: () => {},
  onRatioChange: () => {},
  onRatioReset: () => {},
  onStatusChange: () => {},
  onDrop: () => {},
};

describe('PaneContainer', () => {
  it('single mode: no PaneDivider rendered', () => {
    const { queryByTestId } = render(<PaneContainer {...baseProps} mode="single" />);
    expect(queryByTestId('pane-divider')).toBeNull();
  });

  it('split mode: PaneDivider rendered', () => {
    const { getByTestId } = render(<PaneContainer {...baseProps} mode="split" />);
    expect(getByTestId('pane-divider')).toBeTruthy();
  });

  it('split mode left pane width reflects leftRatio', () => {
    const { container } = render(<PaneContainer {...baseProps} mode="split" leftRatio={0.4} />);
    const leftWrapper = container.querySelector('[style*="flex-basis"]') as HTMLElement | null;
    expect(leftWrapper?.style.flexBasis).toContain('40%');
  });
});

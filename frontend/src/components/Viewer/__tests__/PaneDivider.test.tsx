/// <reference types="vitest/globals" />
import { render, fireEvent } from '@testing-library/react';
import { PaneDivider } from '../PaneDivider';

describe('PaneDivider', () => {
  it('renders with col-resize cursor', () => {
    const { getByTestId } = render(
      <PaneDivider onRatioChange={() => {}} onReset={() => {}} />,
    );
    expect(getByTestId('pane-divider').style.cursor).toBe('col-resize');
  });

  it('dblClick calls onReset', () => {
    const onReset = vi.fn();
    const { getByTestId } = render(
      <PaneDivider onRatioChange={() => {}} onReset={onReset} />,
    );
    fireEvent.dblClick(getByTestId('pane-divider'));
    expect(onReset).toHaveBeenCalledOnce();
  });
});

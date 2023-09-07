import { render } from '@testing-library/react-native';
import React from 'react';
import { COLORS } from 'shared/themed';
import { Progress } from './progress';
// eslint-disable-next-line import/no-internal-modules
import '@testing-library/jest-native/extend-expect';

describe('Progress', () => {
  it('renders correctly with progress 0', () => {
    const { getByTestId } = render(<Progress progress={0} />);

    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '0%' });
  });

  it('renders correctly with progress 50', () => {
    const { getByTestId } = render(<Progress progress={50} />);
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '50%' });
  });

  it('renders correctly with progress 100', () => {
    const { getByTestId } = render(<Progress progress={100} />);
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '100%' });
  });

  it('updates width when progress prop changes', () => {
    const { rerender, getByTestId } = render(<Progress progress={50} />);
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '50%' });
    rerender(<Progress progress={75} />);
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '75%' });
  });

  it('renders a white background progress bar', () => {
    const { getByTestId } = render(<Progress progress={50} />);
    expect(getByTestId('progress-bar')).toHaveStyle({ backgroundColor: 'white' });
  });

  it('renders a primary colored progress bar', () => {
    const { getByTestId } = render(<Progress progress={50} />);
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ backgroundColor: COLORS.primary });
  });
});

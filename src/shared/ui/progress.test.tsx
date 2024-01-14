import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';
import { COLORS } from 'shared/themed';
import { Progress } from './progress';
import '@testing-library/jest-native/extend-expect';

const total = 100;
const progress = 50;

let loaderValue = new Animated.Value(50);

const progressBarInnerId = 'progress-bar-inner';

describe('<Progress/>', () => {
  beforeEach(() => {
    loaderValue = new Animated.Value(50);
  });

  it('renders correctly with progress 0', () => {
    const { getByTestId } = render(<Progress progress={0} total={total} />);

    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '0%' });
  });

  it('renders correctly with progress 50', () => {
    const { getByTestId } = render(
      <Progress loaderValue={loaderValue} progress={progress} total={total} />,
    );
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '50%' });
  });

  it('renders correctly with progress 100', () => {
    const { getByTestId } = render(
      <Progress loaderValue={new Animated.Value(100)} progress={total} total={total} />,
    );
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '100%' });
  });

  it('updates width when progress prop changes', async () => {
    const { getByTestId, rerender } = render(
      <Progress loaderValue={loaderValue} progress={progress} total={total} />,
    );
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '50%' });
    act(() => {
      loaderValue.setValue(75);
    });
    await waitFor(() => {
      rerender(<Progress loaderValue={loaderValue} progress={75} total={total} />);
    });
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '75%' });
  });

  it('renders a white background progress bar', () => {
    const { getByTestId } = render(
      <Progress loaderValue={loaderValue} progress={progress} total={total} />,
    );
    expect(getByTestId('progress-bar')).toHaveStyle({ backgroundColor: 'white' });
  });

  it('renders a primary colored progress bar', () => {
    const { getByTestId } = render(
      <Progress loaderValue={loaderValue} progress={progress} total={total} />,
    );
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ backgroundColor: COLORS.primary });
  });
});

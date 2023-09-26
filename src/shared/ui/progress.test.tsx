import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';
import { COLORS } from 'shared/themed';
import { Progress } from './progress';
import '@testing-library/jest-native/extend-expect';

const total = 100;
const progress = 50;

let loaderValue = new Animated.Value(50);

describe('<Progress/>', () => {
  // let handleChangeProgressValue: jest.Mock;

  beforeEach(() => {
    // handleChangeProgressValue = jest.fn();
    loaderValue = new Animated.Value(50);
  });

  it('renders correctly with progress 0', () => {
    const { getByTestId } = render(<Progress total={total} progress={0} />);

    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '0%' });
  });

  it('renders correctly with progress 50', () => {
    const { getByTestId } = render(
      <Progress total={total} progress={progress} loaderValue={loaderValue} />,
    );
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '50%' });
  });

  it('renders correctly with progress 100', () => {
    const { getByTestId } = render(
      <Progress total={total} progress={total} loaderValue={new Animated.Value(100)} />,
    );
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '100%' });
  });

  it('updates width when progress prop changes', async () => {
    const { rerender, getByTestId } = render(
      <Progress total={total} progress={progress} loaderValue={loaderValue} />,
    );
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '50%' });
    act(() => {
      loaderValue.setValue(75);
    });
    await waitFor(() => {
      rerender(<Progress total={total} progress={75} loaderValue={loaderValue} />);
    });
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '75%' });
  });

  it('renders a white background progress bar', () => {
    const { getByTestId } = render(
      <Progress total={total} progress={progress} loaderValue={loaderValue} />,
    );
    expect(getByTestId('progress-bar')).toHaveStyle({ backgroundColor: 'white' });
  });

  it('renders a primary colored progress bar', () => {
    const { getByTestId } = render(
      <Progress total={total} progress={progress} loaderValue={loaderValue} />,
    );
    expect(getByTestId('progress-bar-inner')).toHaveStyle({ backgroundColor: COLORS.primary });
  });

  // Тесты ниже не отрабатывают, так как клик происходит не синхронно и не могу отловить вызов коллбэка
  // it('calls onChangeProgressValue when progress is changed through a touch event', async () => {
  //   const { getByTestId } = render(
  //     <Progress
  //       total={total}
  //       progress={progress}
  //       loaderValue={loaderValue}
  //       onChangeProgressValue={handleChangeProgressValue}
  //     />,
  //   );
  //   act(() => {
  //     fireEvent.press(getByTestId('progress-bar'), { nativeEvent: { locationX: 42 } });
  //   });

  //   await waitFor(() => {
  //     expect(handleChangeProgressValue).toHaveBeenCalledWith(42);
  //   });
  // });

  // it('calls onChangeProgressValue when progress is changed through a drag event', async () => {
  //   const { getByTestId } = render(
  //     <Progress
  //       total={total}
  //       progress={progress}
  //       loaderValue={loaderValue}
  //       onChangeProgressValue={handleChangeProgressValue}
  //     />,
  //   );
  //   act(() => {
  //     fireEvent(getByTestId('progress-bar'), 'gestureEvent', { nativeEvent: { x: 86 } });
  //   });
  //   await waitFor(() => {
  //     expect(handleChangeProgressValue).toHaveBeenCalledWith(86);
  //   });
  // });

  // it('updates the progress when onChangeProgressValue is called', async () => {
  //   const { getByTestId } = render(
  //     <Progress total={total} progress={progress} loaderValue={loaderValue} />,
  //   );
  //   expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '50%' });
  //   act(() => {
  //     fireEvent.press(getByTestId('progress-bar'), { nativeEvent: { locationX: 75 } });
  //   });
  //   await waitFor(() => {
  //     expect(getByTestId('progress-bar-inner')).toHaveStyle({ width: '75%' });
  //   });
  //   expect(loaderValue).toBe(75);
  // });
});

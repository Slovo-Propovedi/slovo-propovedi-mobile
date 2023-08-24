import { fireEvent, render, screen } from '@testing-library/react-native';
import { Slider } from './slider';

const itemStub = { previewURL: 'https//:vk.com', data: {} };

describe('<Slider/>', () => {
  test('return null if items prop is undefined', () => {
    //@ts-expect-error - undefined is a not a valid items
    render(<Slider items={undefined} />);

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('return null, if items length === 0', () => {
    render(<Slider items={[]} />);

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('return ScrollView, if items length > 0', () => {
    render(<Slider items={[itemStub]} />);

    const tree = screen.toJSON();
    expect(tree).toBeDefined();

    expect(Array.isArray(tree)).toEqual(false);

    if (!tree || Array.isArray(tree)) {
      return;
    }
    expect(tree.type).toEqual('RCTScrollView');
  });

  test('return 2 children, if items length === 2', () => {
    render(<Slider items={[itemStub, itemStub]} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItems = screen.getAllByTestId('slider-item');

    expect(sliderItems.length).toEqual(2);
  });

  test('onPressItem called on press item', () => {
    let mockValue: string | null = null;

    render(
      <Slider
        items={[itemStub]}
        onPressItem={() => {
          mockValue = 'done';
        }}
      />,
    );

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItems = screen.getAllByTestId('slider-item');
    fireEvent.press(sliderItems[0]);

    expect(mockValue).not.toBeNull();
  });
});

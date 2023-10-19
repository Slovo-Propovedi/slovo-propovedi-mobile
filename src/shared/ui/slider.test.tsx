import { fireEvent, render, screen } from '@testing-library/react-native';
import { Slider } from './slider';
import '@testing-library/jest-native/extend-expect';

const itemStub = { data: {}, previewURL: 'https//:vk.com' };

const sliderStub = { items: [itemStub], title: 'title' };

const mockData: { text: null | string } = { text: null };

describe('<Slider/>', () => {
  beforeEach(() => {
    mockData.text = null;
  });

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

  test('return View, if items length > 0', () => {
    render(<Slider items={sliderStub.items} />);

    const tree = screen.toJSON();
    expect(tree).toBeDefined();

    expect(Array.isArray(tree)).toEqual(false);

    if (!tree || Array.isArray(tree)) {
      return;
    }
    expect(tree.type).toEqual('View');
  });

  test('return 2 slider items, if items length === 2', () => {
    render(<Slider items={[itemStub, itemStub]} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItems = screen.getAllByTestId('slider-item');

    expect(sliderItems.length).toEqual(2);
  });

  test('onPressItem called on press item', () => {
    render(
      <Slider
        items={sliderStub.items}
        onPressItem={() => {
          mockData.text = 'done';
        }}
      />,
    );

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItems = screen.getAllByTestId('slider-item');
    fireEvent.press(sliderItems[0]);

    expect(mockData.text).not.toBeNull();
  });

  test('has Text element, if title is defined', () => {
    render(<Slider items={sliderStub.items} title={sliderStub.title} />);

    const titleElement = screen.queryByTestId('title');

    expect(titleElement).not.toBeNull();
  });

  test('content in the Text element equals to title prop', () => {
    render(<Slider items={sliderStub.items} title={sliderStub.title} />);

    const titleElement = screen.queryByTestId('title');

    expect(titleElement).toHaveTextContent(sliderStub.title);
  });

  test('call onPressTitle callback, when press on tittle element', () => {
    render(
      <Slider
        items={sliderStub.items}
        onPressTitle={() => {
          mockData.text = 'new value';
        }}
        title={sliderStub.title}
      />,
    );

    const titleElement = screen.getByTestId('title');

    fireEvent.press(titleElement);

    expect(mockData.text).toEqual('new value');
  });

  test('do not call onPressTitle callback if prop tittle not defined', () => {
    render(
      <Slider
        items={sliderStub.items}
        onPressTitle={() => {
          mockData.text = 'new value';
        }}
      />,
    );

    const titleElement = screen.getByTestId('title');

    fireEvent.press(titleElement);

    expect(mockData.text).toBeNull;
  });
});

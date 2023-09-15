import { fireEvent, render, screen } from '@testing-library/react-native';
import { TouchableListItem } from './touchable-list-item';

const dataStub = {
  title: 'test',
  previewUrl: 'google.com',
};

const mockFunction = jest.fn();

describe('<TouchableListItem/>', () => {
  beforeEach(() => {
    mockFunction.mockClear();
  });

  test('rendered View in the container', () => {
    render(<TouchableListItem data={dataStub} onPress={() => null} />);

    const listItem = screen.getByTestId('list-item');

    expect(listItem.type).toEqual('View');
  });

  test('not called mock function if not touch on item', () => {
    render(<TouchableListItem data={dataStub} onPress={mockFunction} />);

    expect(mockFunction).not.toBeCalled();
  });

  test('mock function is called if touch on item', () => {
    render(<TouchableListItem data={dataStub} onPress={mockFunction} />);

    fireEvent.press(screen.getByTestId('container'));

    expect(mockFunction).toBeCalled();
    expect(mockFunction).toBeCalledTimes(1);
  });
});

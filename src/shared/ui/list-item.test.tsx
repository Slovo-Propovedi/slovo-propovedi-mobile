import { render, screen } from '@testing-library/react-native';
import { ListItem } from './list-item';

const previewPlaceholderTextStub = '1';

const dataStub = {
  title: 'test',
  previewUrl: 'google.com',
};

describe('<TouchableListItem>', () => {
  test('if data defined return View', () => {
    render(<ListItem data={dataStub} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    expect(tree.type).toEqual('View');
  });

  test('displayed placeholder text if previewUrl in data not defined', () => {
    render(<ListItem previewPlaceholderText={previewPlaceholderTextStub} data={dataStub} />);
  });
});

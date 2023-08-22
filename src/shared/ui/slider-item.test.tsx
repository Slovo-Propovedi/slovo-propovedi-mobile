import { render, screen } from '@testing-library/react-native';
import { SliderItem } from './slider-item';

const propsStub = {
  previewURL: 'https://traveltimes.ru/wp-content/uploads/2021/07/image-4-2048x1366.jpg',
  description: 'Hello',
};

describe('<SliderItem/>', () => {
  test('return null if previewURL prop is undefined', () => {
    // @ts-expect-error - undefined is a not a valid previewURL
    render(<SliderItem previewURL={undefined} />);

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('return null, if previewURL === ""', () => {
    render(<SliderItem previewURL='' />);

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('not return null or array, if previewURL is valid', () => {
    render(<SliderItem previewURL={propsStub.previewURL} />);

    const tree = screen.toJSON();
    expect(tree).not.toBeNull();
    expect(Array.isArray(tree)).toEqual(false);
  });
  test('return TouchableImageBackground, if previewURL is valid', () => {
    render(<SliderItem previewURL={propsStub.previewURL} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    expect(tree.type).toEqual('View');

    expect(tree.children).not.toBeNull();
    expect(tree.children?.length).toEqual(1);
  });

  test('is description visible, if description prop defined', () => {
    render(<SliderItem previewURL={propsStub.previewURL} description={propsStub.description} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescription = screen.queryByTestId('slider-item-description');

    expect(sliderItemDescription).not.toBeFalsy();
  });
  test('is description component type View', () => {
    render(<SliderItem previewURL={propsStub.previewURL} description={propsStub.description} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescription = screen.queryByTestId('slider-item-description');

    expect(sliderItemDescription?.type).toEqual('View');
  });
  test('is description child component type Text', () => {
    render(<SliderItem previewURL={propsStub.previewURL} description={propsStub.description} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescription = screen.queryByTestId('slider-item-description');

    expect(sliderItemDescription?.children.length).toEqual(1);
    expect(typeof sliderItemDescription?.children[0]).not.toEqual('string');

    if (typeof sliderItemDescription?.children[0] === 'string') {
      return;
    }

    // expect(sliderItemDescription?.children[0].type.displayName).toEqual('Text');
  });
});

// function Example() {
//   const [name, setUser] = React.useState('');
//   const [show, setShow] = React.useState(false);

//   return (
//     <View>
//       <TextInput value={name} onChangeText={setUser} testID='input' />
//       <Button
//         title='Print Username'
//         onPress={() => {
//           // let's pretend this is making a server request, so it's async
//           // (you'd want to mock this imaginary request in your unit tests)...
//           setTimeout(() => {
//             setShow(true);
//           }, Math.floor(Math.random() * 200));
//         }}
//       />
//       {show && <Text testID='printed-username'>{name}</Text>}
//     </View>
//   );
// }

// test('return TouchableImageBackground, if previewURL is valid', () => {
//   render(
//     <SliderItem previewURL='https://traveltimes.ru/wp-content/uploads/2021/07/image-4-2048x1366.jpg' />,
//   );

//   const tree = screen.toJSON();
//   expect(tree).not.toBeNull();

//   if (!tree || Array.isArray(tree) || !tree.children) {
//     return;
//   }

//   expect(tree.children.length).toBe(1);
//   tree.children[0];
//   console.log('tree.children[0]: ', tree.children[0]);
// });

// test('examples of some things', async () => {
//   const expectedUsername = 'Ada Lovelace';

//   render(<Example />);

//   fireEvent.changeText(screen.getByTestId('input'), expectedUsername);
//   fireEvent.press(screen.getByText('Print Username'));

//   // Using `findBy` query to wait for asynchronous operation to finish
//   const usernameOutput = await screen.findByTestId('printed-username');

//   // Using `toHaveTextContent` matcher from `@testing-library/jest-native` package.
//   expect(usernameOutput)?.toHaveTextContent(expectedUsername);

//   // expect(screen.toJSON()).toMatchSnapshot();
// });

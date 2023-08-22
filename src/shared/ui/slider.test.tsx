import { render, screen } from '@testing-library/react-native';
import { Slider } from './slider';

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
});

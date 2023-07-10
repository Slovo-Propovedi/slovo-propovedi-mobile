import { render, screen, fireEvent } from '@testing-library/react-native';
// eslint-disable-next-line import/no-internal-modules
import '@testing-library/jest-native/extend-expect';
import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import App from 'app';

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

describe('<App />', () => {
  test('has 2 child', () => {
    render(<App />);

    const tree = screen.toJSON();

    if (tree) {
      if (!Array.isArray(tree) && tree.children) {
        expect(tree.children.length).toBe(2);
      }
    }
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

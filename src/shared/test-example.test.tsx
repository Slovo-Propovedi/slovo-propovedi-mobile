import { render, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { View, TextInput } from 'react-native';

function Example() {
  const [name, setUser] = React.useState('');

  return (
    <View>
      <TextInput value={name} onChangeText={setUser} testID='input' />
    </View>
  );
}

test('examples of some things', async () => {
  const expectedUsername = 'Ada Lovelace';

  render(<Example />);

  fireEvent.changeText(screen.getByTestId('input'), expectedUsername);
});

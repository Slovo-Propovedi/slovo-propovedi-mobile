import { render, screen } from '@testing-library/react-native';
import React from 'react';
import '@testing-library/jest-native/extend-expect';
import App from './index';

describe('<App />', () => {
  test('has 2 child', () => {
    render(<App />);

    const tree = screen.toJSON();

    if (tree) {
      if (!Array.isArray(tree) && tree.children && Array.isArray(tree.children)) {
        expect(tree.children.length).toBe(2);
      }
    }
  });
});

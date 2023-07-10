import { debounce } from 'shared/lib';

describe('debounce', () => {
  test('return type is function', () => {
    const func = () => null;

    expect(typeof debounce(func, 10)).toBe('function');
  });
});

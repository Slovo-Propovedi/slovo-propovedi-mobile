import { debounce } from 'shared/lib';

const func = jest.fn();

describe('debounce', () => {
  test('return type is function', () => {
    expect(typeof debounce(func, 10)).toBe('function');
  });
  test('debounced function dont called inside function', () => {
    expect(func).not.toBeCalled();
  });
});

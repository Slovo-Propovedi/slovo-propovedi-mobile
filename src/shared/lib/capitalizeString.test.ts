import { capitalizeString } from './capitalizeString';

let str = '';

describe('capitalizeString', () => {
  beforeEach(() => {
    str = 'word';
  });

  test('argument is string', () => {
    expect(() => capitalizeString([] as never)).toThrowError(
      'В функцию capitalizeString можно передать только строку',
    );
    expect(() => capitalizeString(0 as never)).toThrowError(
      'В функцию capitalizeString можно передать только строку',
    );
  });

  test('return type is string', () => {
    expect(typeof capitalizeString(str)).toEqual('string');

    expect(capitalizeString('')).toEqual('');
  });

  test('first letter is uppercase', () => {
    expect(capitalizeString(str)).toEqual('Word');
  });
});

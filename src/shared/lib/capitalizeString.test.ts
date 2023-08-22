import { capitalizeString } from './capitalizeString';

let str = '';

describe('capitalizeString', () => {
  beforeEach(() => {
    str = 'word';
  });

  test('argument is string', () => {
    //@ts-expect-error - [] is a not a string
    expect(() => capitalizeString([])).toThrowError(
      'В функцию capitalizeString можно передать только строку',
    );
    //@ts-expect-error - 0 is a not a string
    expect(() => capitalizeString(0)).toThrowError(
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

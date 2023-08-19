import { capitalizeString } from 'shared/lib';

let str = '';

describe('capitalizeString', () => {
  beforeEach(() => {
    str = 'word';
  });

  test('argument is string', () => {
    expect(() => capitalizeString(42)).toThrowError(
      'В функцию capitalizeString можно передать только строку',
    );
    expect(() => capitalizeString([])).toThrowError(
      'В функцию capitalizeString можно передать только строку',
    );
    expect(() => capitalizeString(0)).toThrowError(
      'В функцию capitalizeString можно передать только строку',
    );
  });

  test('return type is string', () => {
    expect(typeof capitalizeString(str)).toEqual('string');

    expect(typeof capitalizeString('')).toEqual('string');
  });

  test('first letter is uppercase', () => {
    expect(capitalizeString(str)).toEqual('Word');
  });
});

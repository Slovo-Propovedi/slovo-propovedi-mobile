import { capitalizeString } from 'shared/lib';

let str = '';

describe('capitalizeString', () => {
  beforeEach(() => {
    str = 'word';
  });

  test('return type is string', () => {
    expect(typeof capitalizeString(str)).toEqual('string');
  });
  test('first letter is uppercase', () => {
    expect(capitalizeString(str)).toEqual('Word');
  });
});

import { capitalizeString } from 'shared/lib';

describe('capitalizeString', () => {
  test('return type is string', () => {
    const str = 'word';

    expect(typeof capitalizeString(str)).toBe('string');
  });
  test('first letter is uppercase', () => {
    const str = 'word';

    expect(capitalizeString(str)).toBe('Word');
  });
});

import { getBookLinkAsString } from './getBookLinkAsString';

let stubBookLink = {
  title: 'Title',
};

describe('getBookLinkAsString', () => {
  beforeEach(() => {
    stubBookLink = {
      title: 'Title',
    };
  });

  test('is argument type is object', () => {
    //@ts-expect-error - undefined is a not a valid object
    expect(() => getBookLinkAsString(undefined)).toThrowError('Аргумент должен быть объектом');
    //@ts-expect-error - 'a' is a not a valid object
    expect(() => getBookLinkAsString('a')).toThrowError('Аргумент должен быть объектом');
  });
  test('if title prop is not defined - return ""', () => {
    //@ts-expect-error - {} is a not a valid object
    expect(() => getBookLinkAsString({})).not.toThrowError();
    //@ts-expect-error - {} is a not a valid object
    expect(getBookLinkAsString({})).toEqual('');

    //@ts-expect-error - { chapter: 1, verse: [1, 5] } is a not a valid object
    expect(() => getBookLinkAsString({ chapter: 1, verse: [1, 5] })).not.toThrowError();
    //@ts-expect-error - { chapter: 1, verse: [1, 5] } is a not a valid object
    expect(getBookLinkAsString({ chapter: 1, verse: [1, 5] })).toEqual('');

    expect(() => getBookLinkAsString(stubBookLink)).not.toThrowError();
    expect(getBookLinkAsString(stubBookLink)).toEqual(stubBookLink.title);
  });

  test('if chapter and verse defined - returned string as <{title}. {chapter}:{verse}>', () => {
    expect(getBookLinkAsString({ chapter: 1, title: stubBookLink.title, verse: 1 })).toEqual(
      `${stubBookLink.title}. 1:1`,
    );
    expect(getBookLinkAsString({ chapter: 1, title: stubBookLink.title, verse: [1, 3] })).toEqual(
      `${stubBookLink.title}. 1:1-3`,
    );
  });
});

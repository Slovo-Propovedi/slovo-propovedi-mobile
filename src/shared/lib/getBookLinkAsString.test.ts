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
    expect(() => getBookLinkAsString(undefined)).toThrow('Аргумент должен быть объектом');
    //@ts-expect-error - 'a' is a not a valid object
    expect(() => getBookLinkAsString('a')).toThrow('Аргумент должен быть объектом');
  });
  test('if title prop is not defined - return ""', () => {
    //@ts-expect-error - {} is a not a valid object
    expect(() => getBookLinkAsString({})).not.toThrow();
    //@ts-expect-error - {} is a not a valid object
    expect(getBookLinkAsString({})).toEqual('');

    //@ts-expect-error - { chapter: 1, verse: [1, 5] } is a not a valid object
    expect(() => getBookLinkAsString({ chapter: 1, verse: [1, 5] })).not.toThrow();
    //@ts-expect-error - { chapter: 1, verse: [1, 5] } is a not a valid object
    expect(getBookLinkAsString({ chapter: 1, verse: [1, 5] })).toEqual('');

    //@ts-expect-error - stubBookLink is a not a valid object
    expect(() => getBookLinkAsString(stubBookLink)).not.toThrow();
    //@ts-expect-error - stubBookLink is a not a valid object
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

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

  test('argument type is object with required prop - title', () => {
    //@ts-expect-error - undefined is a not a valid object
    expect(() => getBookLinkAsString(undefined)).toThrowError('Аргумент должен быть объектом');
    //@ts-expect-error - 'a' is a not a valid object
    expect(() => getBookLinkAsString('a')).toThrowError('Аргумент должен быть объектом');
    //@ts-expect-error - {} is a not a valid object
    expect(() => getBookLinkAsString({})).toThrowError(
      'Аргумент должен быть объектом с обязательным полем title',
    );
    //@ts-expect-error - { chapter: 1, verse: [1, 5] } is a not a valid object
    expect(() => getBookLinkAsString({ chapter: 1, verse: [1, 5] })).toThrowError(
      'Аргумент должен быть объектом с обязательным полем title',
    );

    expect(() => getBookLinkAsString(stubBookLink)).not.toThrowError();
  });
});

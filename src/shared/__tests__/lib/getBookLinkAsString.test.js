import { getBookLinkAsString } from 'shared/lib';

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
    expect(() => getBookLinkAsString()).toThrowError('Аргумент должен быть объектом');
    expect(() => getBookLinkAsString('a')).toThrowError('Аргумент должен быть объектом');
    expect(() => getBookLinkAsString({})).toThrowError(
      'Аргумент должен быть объектом с обязательным полем title',
    );
    expect(() => getBookLinkAsString({ chapter: 1, verse: [1, 5] })).toThrowError(
      'Аргумент должен быть объектом с обязательным полем title',
    );

    expect(() => getBookLinkAsString(stubBookLink)).not.toThrowError();
  });
});

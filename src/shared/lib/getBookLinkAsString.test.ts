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
    expect(() => getBookLinkAsString(undefined as never)).toThrowError(
      'Аргумент должен быть объектом',
    );
    expect(() => getBookLinkAsString('a' as never)).toThrowError('Аргумент должен быть объектом');
    expect(() => getBookLinkAsString({} as never)).toThrowError(
      'Аргумент должен быть объектом с обязательным полем title',
    );
    expect(() => getBookLinkAsString({ chapter: 1, verse: [1, 5] } as never)).toThrowError(
      'Аргумент должен быть объектом с обязательным полем title',
    );

    expect(() => getBookLinkAsString(stubBookLink)).not.toThrowError();
  });
});

import { isNonNullable } from './';

type GetBookLinkAsStringProps = {
  title: string;
} & (
  | {
      chapter: number;
      verse?: [from: number, to: number] | number;
    }
  | {
      chapter?: undefined;
      verse?: undefined;
    }
);

export const getBookLinkAsString = (props: GetBookLinkAsStringProps) => {
  if (typeof props !== 'object') {
    throw new Error('Аргумент должен быть объектом');
  }

  if (!props.title) {
    return '';
  }

  if (!('chapter' in props) || !props.chapter) {
    return props.title;
  }

  const { chapter, title, verse } = props;

  const verseAsString =
    (isNonNullable(verse) && Array.isArray(verse) ? `${verse[0]}-${verse[1]}` : verse) || '';

  return `${title}. ${chapter}${verseAsString ? `:${verseAsString}` : ''}`;
};

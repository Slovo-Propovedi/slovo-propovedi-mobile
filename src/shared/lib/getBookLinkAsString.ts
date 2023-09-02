import { isNonNullable } from './isNonNullable';

type GetBookLinkAsStringProps = {
  title: string;
} & (
  | {
      chapter?: undefined;
      verse?: undefined;
    }
  | {
      chapter: number;
      verse?: number | [from: number, to: number];
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

  const { title, chapter, verse } = props;

  const verseAsString =
    (isNonNullable(verse) && Array.isArray(verse) ? `${verse[0]}-${verse[1]}` : verse) || '';

  return `${title}. ${chapter}${verseAsString ? `:${verseAsString}` : ''}`;
};

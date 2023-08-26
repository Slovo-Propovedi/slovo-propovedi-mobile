type GetBookLinkAsString = (
  arg:
    | {
        title: string;
        chapter?: undefined;
        verse?: undefined;
      }
    | {
        title: string;
        chapter: number;
        verse: number | [from: number, to: number];
      },
) => string;

export const getBookLinkAsString: GetBookLinkAsString = (props) => {
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

  return `${title}. ${chapter || -1}:${
    Array.isArray(verse) ? `${verse[0]}-${verse[1]}` : verse || -1
  }`;
};

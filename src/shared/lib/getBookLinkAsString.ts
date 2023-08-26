type GetBookLinkAsString = (arg: {
  title?: string;
  chapter?: number | undefined;
  verse?: number | [from: number, to: number] | undefined;
}) => string;

// TODO Переделать. Убрать исключения
export const getBookLinkAsString: GetBookLinkAsString = (props) => {
  if (typeof props !== 'object') {
    throw new Error('Аргумент должен быть объектом');
  }

  const { title, chapter, verse } = props;

  if (!title) {
    throw new Error('Аргумент должен быть объектом с обязательным полем title');
  }

  return `${title}. ${chapter || -1}:${
    Array.isArray(verse) ? `${verse[0]}-${verse[1]}` : verse || -1
  }`;
};

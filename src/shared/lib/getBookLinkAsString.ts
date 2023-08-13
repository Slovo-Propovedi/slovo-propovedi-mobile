type GetBookLinkAsString = (arg: {
  title: string;
  chapter?: number | undefined;
  verse?: number | [from: number, to: number] | undefined;
}) => string;

export const getBookLinkAsString: GetBookLinkAsString = ({ title, chapter, verse }) =>
  `${title}. ${chapter || -1}:${Array.isArray(verse) ? `${verse[0]}-${verse[1]}` : verse || -1}`;

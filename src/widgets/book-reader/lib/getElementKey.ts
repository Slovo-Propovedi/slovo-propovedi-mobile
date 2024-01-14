import type { XMLElementName } from 'entities/book-reader';

interface GetElementKeyProps {
  endWith?: number | string;
  name: '' | XMLElementName;
  startWith: string;
}

export const getElementKey = ({ endWith, name, startWith }: GetElementKeyProps) =>
  `${startWith}-${name}-${endWith || ''}`;

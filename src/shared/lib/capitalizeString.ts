export const capitalizeString = (str: string) => {
  if (typeof str !== 'string')
    throw new Error('В функцию capitalizeString можно передать только строку');

  const firstLetter = str.at(0);

  if (!firstLetter) return '';

  return str.replace(/^./, firstLetter.toUpperCase());
};

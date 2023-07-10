export const capitalizeString = (str: string) => {
  const first = str[0];
  return str.replace(/^./, first.toUpperCase());
};

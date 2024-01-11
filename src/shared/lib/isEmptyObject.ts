export const isEmptyObject = <T extends null | object | undefined>(obj: T) => {
  for (const key in obj) return false;

  return true;
};

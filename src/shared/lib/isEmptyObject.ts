export const isEmptyObject = <T extends object | undefined | null>(obj: T) => {
  for (const key in obj) {
    return false;
  }
  return true;
};

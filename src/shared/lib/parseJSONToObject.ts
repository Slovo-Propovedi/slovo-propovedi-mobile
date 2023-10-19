export const parseJSONToObject = <T>(value: null | string, onError?: (error: Error) => void) => {
  try {
    if (value) {
      return JSON.parse(value) as T;
    }
  } catch (error) {
    if (onError) {
      onError(error as Error);
    } else {
      console.error('Error in parseJSONToObject: ', error);
    }
    return null;
  }
  return null;
};

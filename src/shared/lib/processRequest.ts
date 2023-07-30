export const processRequest = async <T>(
  promise: Promise<T>,
  errorMessage = 'Ошибка запроса',
): Promise<{ data: Awaited<T>; error: null } | { data: null; error: Error }> => {
  try {
    const data = await promise;

    return { data, error: null };
  } catch (error) {
    // addToast(errorMessage, { type: 'error' });

    console.error(`${errorMessage}: `, error);

    return { data: null, error: error as Error };
  }
};

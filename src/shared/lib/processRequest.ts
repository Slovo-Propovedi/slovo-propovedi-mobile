export const processRequest = async <T>(
  promise: Promise<T>,
): Promise<{ data: Awaited<T> | null; error: Error | null }> => {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

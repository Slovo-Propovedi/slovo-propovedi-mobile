import { processRequest } from './processRequest';

export type GetFileOnUrl = (props: {
  name: string;
  path: string;
  type: string;
}) => Promise<File | null>;

export const getFileOnUrl: GetFileOnUrl = async ({ name, path, type }) => {
  if (path) {
    const { data: responseData, error: responseError } = await processRequest(fetch(path));
    if (responseData) {
      const data = await responseData.blob();

      const metadata: FilePropertyBag = {
        type,
      };

      return new File([data], name, metadata);
    }

    if (responseError) {
      console.error('Getting local file error: ', responseError);
    }
  }

  return null;
};

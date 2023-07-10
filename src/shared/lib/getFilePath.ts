export const getFilePath = (file: File) =>
  new Promise<string | null>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const result = reader.result;
      resolve(String(result));
    };
    reader.onerror = () => {
      reject(`File preview not load. ${reader.error?.message ?? ''}`);
    };
  });

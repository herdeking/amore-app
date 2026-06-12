import * as FileSystem from 'expo-file-system/legacy';

const IMGBB_API_KEY = '405b4c04088db65af0932530b5bf0420';

export const uploadToImgbb = async (uri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const formData = new FormData();
  formData.append('image', base64);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Imgbb: ${JSON.stringify(data)}`);
  }
  return data.data.url;
};

import * as FileSystem from 'expo-file-system/legacy';

const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'amore_simple';

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const uniqueId = `amore_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64}`,
        upload_preset: UPLOAD_PRESET,
        public_id: uniqueId,
      }),
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(`Cloudinary: ${JSON.stringify(data.error)}`);
  }
  if (!data.secure_url) {
    throw new Error(`No URL in response: ${JSON.stringify(data)}`);
  }
  return data.secure_url;
};

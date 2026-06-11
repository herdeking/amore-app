import * as FileSystem from 'expo-file-system/legacy';

const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'Display_name';

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const uniqueId = Date.now().toString();

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64}`,
        upload_preset: UPLOAD_PRESET,
        public_id: `amore_${uniqueId}`,
      }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

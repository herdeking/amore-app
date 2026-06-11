import * as FileSystem from 'expo-file-system/legacy';

const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'Display_name';

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64}`,
        upload_preset: UPLOAD_PRESET,
        use_filename: false,
        unique_filename: true,
      }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

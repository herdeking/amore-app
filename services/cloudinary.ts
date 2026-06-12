import * as FileSystem from 'expo-file-system/legacy';
import { uploadToImgbb } from './imgbb';

const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'amore_simple';

const tryCloudinary = async (base64: string): Promise<string> => {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64}`,
        upload_preset: UPLOAD_PRESET,
      }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  if (!data.secure_url) throw new Error('No URL returned');
  return data.secure_url;
};

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    return await tryCloudinary(base64);
  } catch (cloudErr: any) {
    console.log('Cloudinary failed, trying imgbb:', cloudErr.message);
    try {
      return await uploadToImgbb(uri);
    } catch (imgbbErr: any) {
      throw new Error(`Both upload services failed. Cloudinary: ${cloudErr.message} | Imgbb: ${imgbbErr.message}`);
    }
  }
};

import * as FileSystem from 'expo-file-system/legacy';
import { verifyPhotoGender } from './genderDetection';

const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'Amore_upload';

export const uploadToCloudinary = async (uri: string, userGender?: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // AI Gender verification
    if (userGender && userGender !== 'Other') {
      const check = await verifyPhotoGender(base64, userGender);
      if (!check.approved) {
        throw new Error(
          check.reason ?? 
          `Photo rejected: Please upload a photo that matches your registered gender (${userGender}). This helps keep Amore safe and authentic.`
        );
      }
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: `data:image/jpeg;base64,${base64}`,
          upload_preset: UPLOAD_PRESET,
          public_id: `amore_${Date.now()}`,
        }),
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.secure_url;
  } catch (e: any) {
    throw new Error(e.message);
  }
};

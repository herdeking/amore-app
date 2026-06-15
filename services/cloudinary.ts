import * as FileSystem from 'expo-file-system/legacy';
import { uploadToImgbb } from './imgbb';

const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'amore_simple';

const isVideoUri = (uri: string): boolean => {
  const lower = uri.toLowerCase();
  return lower.includes('.mp4') || lower.includes('.mov') ||
    lower.includes('.avi') || lower.includes('.mkv') ||
    lower.includes('video');
};

const tryCloudinary = async (base64: string, isVideo: boolean): Promise<string> => {
  const resourceType = isVideo ? 'video' : 'image';
  const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
  const publicId = `amore_${Date.now()}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: `data:${mimeType};base64,${base64}`,
      upload_preset: UPLOAD_PRESET,
      resource_type: resourceType,
      public_id: publicId,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  if (!data.secure_url) throw new Error('No URL returned');
  return data.secure_url;
};

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const isVideo = isVideoUri(uri);

  // Videos can be large — read as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    return await tryCloudinary(base64, isVideo);
  } catch (cloudErr: any) {
    console.log('Cloudinary failed:', cloudErr.message);
    // Only try imgbb for images (imgbb doesn't support video)
    if (!isVideo) {
      try {
        return await uploadToImgbb(uri);
      } catch (imgbbErr: any) {
        throw new Error(`Both upload services failed. Cloudinary: ${cloudErr.message} | Imgbb: ${imgbbErr.message}`);
      }
    }
    throw new Error(`Video upload failed: ${cloudErr.message}`);
  }
};

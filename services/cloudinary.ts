import * as FileSystem from 'expo-file-system/legacy';
import { uploadToImgbb } from './imgbb';

const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'amore_simple';

const isVideoUri = (uri: string): boolean => {
  const lower = uri.toLowerCase();
  return lower.includes('.mp4') || lower.includes('.mov') ||
    lower.includes('.avi') || lower.includes('.mkv') ||
    lower.includes('video') || lower.includes('.3gp');
};

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const isVideo = isVideoUri(uri);
  const resourceType = isVideo ? 'video' : 'image';

  try {
    // Use FileSystem.uploadAsync for native-backed multipart upload — avoids the
    // FormData/Blob incompatibilities present under React Native's New Architecture.
    const uploadResult = await FileSystem.uploadAsync(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      uri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
        parameters: {
          upload_preset: UPLOAD_PRESET,
          resource_type: resourceType,
        },
      }
    );

    const data = JSON.parse(uploadResult.body);
    if (data.error) throw new Error(JSON.stringify(data.error));
    if (!data.secure_url) throw new Error('No URL returned from Cloudinary');
    return data.secure_url;

  } catch (cloudErr: any) {
    console.log('Cloudinary failed:', cloudErr.message);

    // Fallback to imgbb for images only
    if (!isVideo) {
      try {
        return await uploadToImgbb(uri);
      } catch (imgbbErr: any) {
        throw new Error(`Both upload services failed. Cloudinary: ${cloudErr.message} | Imgbb: ${imgbbErr.message}`);
      }
    }

    // For video - try base64 as last resort
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const response2 = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: `data:video/mp4;base64,${base64}`,
            upload_preset: UPLOAD_PRESET,
          }),
        }
      );
      const data2 = await response2.json();
      if (data2.secure_url) return data2.secure_url;
      throw new Error(JSON.stringify(data2.error));
    } catch (b64Err: any) {
      throw new Error(`Video upload failed: ${b64Err.message}`);
    }
  }
};

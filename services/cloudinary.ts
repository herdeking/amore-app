const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'ml_default';

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: uri,
        upload_preset: UPLOAD_PRESET,
      }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

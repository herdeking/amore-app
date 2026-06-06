const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'ml_default'; // change this to your preset name

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'ml_default';

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const formData = new FormData();
  
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri, name: filename, type } as any);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

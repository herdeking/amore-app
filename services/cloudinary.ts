const CLOUD_NAME = 'danwexfev';
const UPLOAD_PRESET = 'Amore_upload';

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const form = new FormData();
  form.append('file', { uri, name: filename, type: mimeType } as any);
  form.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.secure_url;
};

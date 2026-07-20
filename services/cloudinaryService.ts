export const uploadToCloudinary = async (file: File): Promise<string | null> => {
  const cloudName = 'ojimxie2';
  const apiKey = '169855786974973';
  const apiSecret = '0XZ8c_-Ga9-bh9ECaHzEMpRuztY';

  const timestamp = Math.round((new Date()).getTime() / 1000).toString();
  const folder = 'iabs_store';
  
  // Create signature string (parameters must be sorted alphabetically)
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  
  try {
    // Hash signature string using SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (result.secure_url) {
      return result.secure_url;
    }
    console.error('Cloudinary upload error:', result);
    return null;
  } catch (e) {
    console.error('Cloudinary upload failed:', e);
    return null;
  }
};

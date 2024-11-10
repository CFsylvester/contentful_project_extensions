// src/utils.js

export const fetchAssets = async (sdk, query = {}) => {
  try {
    const response = await sdk.space.getAssets(query);
    return response.items;
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

// Utility function to read file as Base64 URL
export const readFileAsUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const [prefix, data] = result.split(',');
      resolve([prefix, data]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Utility function to determine content type from image URL
export const findImageContentType = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const contentType = response.headers.get('Content-Type');
    return contentType;
  } catch (error) {
    console.error('Error fetching content type:', error);
    throw error;
  }
};

// Utility function to extract image URL from data transfer
export const getImageUrlFromDataTransfer = async (dataTransfer) => {
  const url = dataTransfer.getData('URL');
  if (url && /^https?:\/\//.test(url)) {
    return url;
  }
  return null;
};

// Utility function to extract asset ID from data transfer
export const getAssetIdFromDataTransfer = (dataTransfer) => {
  const id = dataTransfer.getData('text/plain');
  if (id && id.startsWith('asset-')) {
    return id.replace('asset-', '');
  }
  return null;
};

// Utility function to convert data transfer items to Base64 if they are valid images
export const getBase64FromDataTransfer = async (dataTransfer) => {
  const items = dataTransfer.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file' && /^image\/[\w-_|\w+\w]+$/.test(item.type)) {
      const file = item.getAsFile();
      if (file) {
        const [prefix, data] = await readFileAsUrl(file);
        return { prefix, data, type: file.type };
      }
    }
  }
  return null;
};

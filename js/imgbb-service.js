/**
 * ============================================================================
 * Ape Pin Potha | Cloud Image Upload Service (Cloudinary & ImgBB)
 * ============================================================================
 * Primary Image Hosting: Cloudinary (Zero-Transformation Mode)
 * Preserves high performance while consuming 0 transformation credits.
 */

export const CLOUDINARY_CONFIG = {
  cloudName: 'xvygfeh6',
  uploadPreset: 'apepinpotha_uploads',
  folder: 'apepinpotha',
  endpoint: 'https://api.cloudinary.com/v1_1/xvygfeh6/image/upload'
};

export const IMGBB_CONFIG = {
  apiKey: "f048c857d1c61df16a650b4b65074368"
};

/**
 * Get active ImgBB API Key (from config or localStorage)
 */
export function getImgBBApiKey() {
  return (
    IMGBB_CONFIG.apiKey ||
    localStorage.getItem('pinPotha_imgbb_apiKey') ||
    ""
  );
}

/**
 * Set and persist ImgBB API Key
 */
export function setImgBBApiKey(key) {
  const clean = (key || "").trim();
  IMGBB_CONFIG.apiKey = clean;
  localStorage.setItem('pinPotha_imgbb_apiKey', clean);
}

/**
 * Compresses an image file client-side before uploading to save bandwidth and ensure instant uploads
 * @param {File|Blob} file 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<Blob>}
 */
export function compressImageFile(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (file.type && !file.type.startsWith('image/')) {
      return reject(new Error("කරුණාකර වලංගු ඡායාරූපයක් (Image file) තෝරන්න."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ඡායාරූපය කියවීමට නොහැකි විය."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("ඡායාරූපය Load කිරීමට නොහැකි විය."));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // ImgBB API supports JPEG natively with 100% stability
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file); // fallback to original file
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts file or blob to an optimized, compressed base64 Data URL
 * @param {File|Blob} file 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<string>}
 */
export function fileToCompressedDataURL(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(e.target.result);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file, blob or remote URL to Cloudinary (Zero-Transformation Mode).
 * Returns the exact direct secure_url without f_auto,q_auto to consume 0 transformation credits.
 * Falls back seamlessly to compressed base64 if cloud upload fails.
 * @param {File|Blob|string} fileOrBlob 
 * @param {string} [customName]
 * @returns {Promise<string>} Direct image URL or compressed Data URL fallback
 */
export async function uploadToCloudinary(fileOrBlob, customName = "pinpotha_upload") {
  // 1. Pre-generate safe fallback if possible
  let fallbackDataUrl = null;
  if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:image/')) {
    fallbackDataUrl = fileOrBlob;
  } else if (fileOrBlob instanceof Blob || (typeof File !== 'undefined' && fileOrBlob instanceof File)) {
    try {
      fallbackDataUrl = await fileToCompressedDataURL(fileOrBlob, 1200, 0.82);
    } catch (e) {
      console.warn("[Cloudinary] Could not generate fallback data URL:", e);
    }
  }

  // 2. Pre-compress to JPEG client-side if it's a file/blob to minimize upload size & speed up transfers
  let uploadPayload = fileOrBlob;
  if (fileOrBlob instanceof Blob || (typeof File !== 'undefined' && fileOrBlob instanceof File)) {
    try {
      uploadPayload = await compressImageFile(fileOrBlob, 1200, 0.84);
    } catch (err) {
      console.warn("[Cloudinary] Pre-compression skipped, uploading original:", err);
      uploadPayload = fileOrBlob;
    }
  }

  try {
    const formData = new FormData();
    if (uploadPayload instanceof Blob) {
      formData.append('file', uploadPayload, `${customName}.jpg`);
    } else {
      formData.append('file', uploadPayload);
    }
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', CLOUDINARY_CONFIG.folder);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(CLOUDINARY_CONFIG.endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const resData = await response.json();

    if (response.ok && resData && resData.secure_url) {
      // Return exact secure_url without adding any /f_auto,q_auto/ transformations
      return resData.secure_url;
    }

    console.warn("[Cloudinary] Upload failed, utilizing fallback:", resData?.error?.message);
    if (fallbackDataUrl) {
      return fallbackDataUrl;
    }
    throw new Error(resData?.error?.message || "Cloudinary upload error");
  } catch (err) {
    console.warn("[Cloudinary] Network/API error, falling back to local compressed image:", err.message);
    if (fallbackDataUrl) {
      return fallbackDataUrl;
    }
    throw err;
  }
}

/**
 * Upload an image file to cloud storage (aliased to Cloudinary for backward compatibility).
 * @param {File|Blob} file 
 * @param {string} [customName]
 * @returns {Promise<string>} Direct image URL or high-quality compressed Data URL
 */
export async function uploadToImgBB(file, customName = "pinpotha_upload") {
  return uploadToCloudinary(file, customName);
}

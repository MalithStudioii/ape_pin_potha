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
 * Converts a Base64 Data URI to a binary Blob
 * @param {string} dataURI 
 * @returns {Blob|null}
 */
export function dataURItoBlob(dataURI) {
  if (!dataURI || typeof dataURI !== 'string') return null;
  const parts = dataURI.split(',');
  if (parts.length < 2) return null;
  try {
    const byteString = atob(parts[1]);
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeString = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch (err) {
    console.warn("[Upload] Failed converting Data URI to Blob:", err);
    return null;
  }
}

/**
 * Upload an image file, blob, Data URI, or remote URL to Cloudinary (Zero-Transformation Mode).
 * Returns the exact direct secure_url without f_auto,q_auto to consume 0 transformation credits.
 * Strictly throws an error on failure with NO silent Base64 fallback.
 * @param {File|Blob|string} fileOrBlob 
 * @param {string} [customName]
 * @returns {Promise<string>} Direct Cloudinary secure_url
 */
export async function uploadToCloudinary(fileOrBlob, customName = "pinpotha_upload") {
  if (!fileOrBlob) {
    throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
  }

  // 1. If it's already a Cloudinary secure_url, return it directly
  if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('http')) {
    if (fileOrBlob.includes('res.cloudinary.com')) {
      return fileOrBlob;
    }
  }

  let uploadBlob = null;

  // 2. Convert Data URI to binary Blob if needed
  if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:image/')) {
    uploadBlob = dataURItoBlob(fileOrBlob);
    if (!uploadBlob) {
      throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
    }
  } else if (fileOrBlob instanceof Blob || (typeof File !== 'undefined' && fileOrBlob instanceof File)) {
    uploadBlob = fileOrBlob;
  }

  // 3. Pre-compress Blob client-side to JPEG to minimize bandwidth
  if (uploadBlob) {
    try {
      uploadBlob = await compressImageFile(uploadBlob, 1200, 0.84);
    } catch (err) {
      console.warn("[Cloudinary] Pre-compression skipped, uploading original blob:", err);
    }
  }

  try {
    const formData = new FormData();
    if (uploadBlob) {
      formData.append('file', uploadBlob, `${customName}.jpg`);
    } else if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('http')) {
      formData.append('file', fileOrBlob);
    } else {
      throw new Error("වලංගු නොවන ඡායාරූප ආකෘතියකි.");
    }

    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', CLOUDINARY_CONFIG.folder);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(CLOUDINARY_CONFIG.endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const resData = await response.json();

    if (response.ok && resData && resData.secure_url) {
      // Return exact secure_url without adding any transformations
      return resData.secure_url;
    }

    console.error("[Cloudinary] Upload rejected by server:", resData?.error?.message);
    throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
  } catch (err) {
    console.error("[Cloudinary] Network or upload failure:", err);
    throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
  }
}

/**
 * Upload an image file to cloud storage (aliased to Cloudinary for backward compatibility).
 * @param {File|Blob|string} file 
 * @param {string} [customName]
 * @returns {Promise<string>} Direct Cloudinary secure_url
 */
export async function uploadToImgBB(file, customName = "pinpotha_upload") {
  return uploadToCloudinary(file, customName);
}

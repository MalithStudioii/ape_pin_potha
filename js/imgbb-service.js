/**
 * ============================================================================
 * පිං පොත | ImgBB Cloud Image Upload Service
 * ============================================================================
 * ImgBB API මගින් නොමිලේ ඡායාරූප සත්කාරක පහසුකම (Free Unlimited Image Hosting)
 * API Endpoint: https://api.imgbb.com/1/upload
 */

export const IMGBB_CONFIG = {
  // සක්‍රීය ImgBB Free API Key එක
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
 * @param {File} file 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<Blob>}
 */
export function compressImageFile(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
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
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file); // fallback to original file
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file to ImgBB and return direct image URL
 * @param {File|Blob} file 
 * @param {string} [customName]
 * @returns {Promise<string>} Direct permanent image URL
 */
export async function uploadToImgBB(file, customName = "pinpotha_upload") {
  let apiKey = getImgBBApiKey();

  if (!apiKey) {
    const enteredKey = prompt(
      "🔑 ImgBB Free API Key එකක් ඇතුළත් කරන්න:\n\n" +
      "1. https://api.imgbb.com වෙත යන්න.\n" +
      "2. නොමිලේ 'Get API Key' ක්ලික් කර ලැබෙන Key එක Copy කරන්න.\n" +
      "3. එය මෙහි Paste කර OK කරන්න:"
    );

    if (enteredKey && enteredKey.trim()) {
      apiKey = enteredKey.trim();
      setImgBBApiKey(apiKey);
    } else {
      throw new Error("ImgBB API Key එක නොමැතිව ඡායාරූපය Upload කළ නොහැක.");
    }
  }

  // Pre-compress to WebP for fast upload
  let uploadBlob = file;
  try {
    uploadBlob = await compressImageFile(file, 1400, 0.85);
  } catch (err) {
    console.warn("[ImgBB] Pre-compression skipped, uploading original:", err);
    uploadBlob = file;
  }

  const formData = new FormData();
  formData.append('image', uploadBlob, `${customName}.webp`);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    const errorMsg = resData?.error?.message || "ImgBB වෙත ඡායාරූපය Upload කිරීම අසාර්ථක විය.";
    if (errorMsg.toLowerCase().includes("invalid api key")) {
      localStorage.removeItem('pinPotha_imgbb_apiKey');
      IMGBB_CONFIG.apiKey = "";
      throw new Error("ඔබ ඇතුළත් කළ ImgBB API Key එක වැරදිසහගතයි. කරුණාකර නිවැරදි Key එක නැවත ඇතුළත් කරන්න.");
    }
    throw new Error(errorMsg);
  }

  // Prefer direct display URL
  const imageUrl = resData.data.display_url || resData.data.url;
  return imageUrl;
}

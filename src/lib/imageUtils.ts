export interface PreparedImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

/**
 * Downscales large camera photos on a canvas to <= 1500px on the longest edge
 * so uploads are fast and crisp for Gemini vision analysis.
 */
export async function prepareImageFile(file: File): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("The selected file is not a valid image."));
      img.onload = () => {
        const maxDim = 1500;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas rendering context unavailable."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, 0.88);
        const base64 = dataUrl.split(",")[1] || "";
        resolve({ dataUrl, base64, mimeType });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Loads a built-in static specimen image URL into a base64 payload for live Gemini analysis.
 */
export async function prepareImageFromUrl(url: string): Promise<PreparedImage> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Could not load sample image.");
  }
  const blob = await res.blob();
  const file = new File([blob], "specimen.jpg", { type: blob.type || "image/jpeg" });
  return prepareImageFile(file);
}

/**
 * Generates a compact thumbnail data URL for localStorage persistence so saved garden
 * collections stay comfortably under browser storage quotas.
 */
export async function createThumbnailDataUrl(sourceDataUrl: string, maxEdge = 480): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxEdge || height > maxEdge) {
        if (width >= height) {
          height = Math.round((height * maxEdge) / width);
          width = maxEdge;
        } else {
          width = Math.round((width * maxEdge) / height);
          height = maxEdge;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => resolve(sourceDataUrl);
    img.src = sourceDataUrl;
  });
}

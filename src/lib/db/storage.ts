/**
 * Optimizes an image using HTML5 Canvas:
 * - Resizes to max 512x512 pixels.
 * - Compresses to JPEG format.
 * - Returns a Base64 Data URL (Free-Tier Friendly).
 */
export const processProfileImageBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed."));

        // Fill background white for JPEGs (in case of PNG transparency)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Return compressed Base64 Data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75); // 75% quality to save database space
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
};

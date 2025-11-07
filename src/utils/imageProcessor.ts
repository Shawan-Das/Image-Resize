export const removeBackground = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const cornerSamples = [
          { x: 0, y: 0 },
          { x: canvas.width - 1, y: 0 },
          { x: 0, y: canvas.height - 1 },
          { x: canvas.width - 1, y: canvas.height - 1 },
        ];

        const bgColors: Array<{ r: number; g: number; b: number }> = [];
        cornerSamples.forEach(({ x, y }) => {
          const idx = (y * canvas.width + x) * 4;
          bgColors.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
          });
        });

        const avgBgColor = {
          r: bgColors.reduce((sum, c) => sum + c.r, 0) / bgColors.length,
          g: bgColors.reduce((sum, c) => sum + c.g, 0) / bgColors.length,
          b: bgColors.reduce((sum, c) => sum + c.b, 0) / bgColors.length,
        };

        const threshold = 50;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const distance = Math.sqrt(
            Math.pow(r - avgBgColor.r, 2) +
              Math.pow(g - avgBgColor.g, 2) +
              Math.pow(b - avgBgColor.b, 2)
          );

          if (distance < threshold) {
            data[i + 3] = 0;
          } else if (distance < threshold * 2) {
            const alpha = ((distance - threshold) / threshold) * 255;
            data[i + 3] = Math.min(255, alpha);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const resizeImage = async (
  file: File,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const compressImage = async (
  file: File,
  quality: number
): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', quality / 100));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Convert an existing data URL (or image data URL) into another image format.
 * Supported formats: 'png', 'jpeg', 'webp'. Quality (0-100) applies to jpeg/webp.
 */
export const exportImage = async (
  dataUrl: string,
  format: 'png' | 'jpeg' | 'webp',
  quality?: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let mime = 'image/png';
        if (format === 'jpeg') mime = 'image/jpeg';
        if (format === 'webp') mime = 'image/webp';

        const q = typeof quality === 'number' ? Math.max(0.01, Math.min(1, quality / 100)) : undefined;

        // toDataURL ignores quality for PNG
        const out = q && mime !== 'image/png' ? canvas.toDataURL(mime, q) : canvas.toDataURL(mime);
        resolve(out);
      } catch (err) {
        reject(err);
      }
    };
  img.onerror = () => reject(new Error('Failed to load image for export'));
    img.src = dataUrl;
  });
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

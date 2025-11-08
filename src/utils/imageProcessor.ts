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


export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};


export const getDataUrlSize = (dataUrl: string): number => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  return blob.size;
};

export const estimateCompressedSize = async (
  imageDataUrl: string,
  quality: number
): Promise<number> => {
  const compressed = await compressImage(
    dataUrlToFile(imageDataUrl, 'temp.jpg'),
    quality
  );
  return getDataUrlSize(compressed);
};


export interface QualityResult {
  quality: number;
  actualSize: number;
  isExact: boolean;
}


export const findQualityForTargetSize = async (
  imageDataUrl: string,
  targetSize: number
): Promise<QualityResult> => {
  // First check if target size is achievable
  const minSize = await estimateCompressedSize(imageDataUrl, 1);
  const maxSize = await estimateCompressedSize(imageDataUrl, 100);
  
  if (targetSize >= maxSize) {
    return { quality: 100, actualSize: maxSize, isExact: false };
  }
  if (targetSize <= minSize) {
    return { quality: 1, actualSize: minSize, isExact: false };
  }

  let minQ = 1;
  let maxQ = 100;
  let bestQuality = 50;
  let bestSize = 0;
  let bestSizeDiff = Infinity;
  const tolerance = targetSize * 0.005; // 0.5% tolerance - much stricter

  // Try up to 20 iterations to get very precise
  for (let i = 0; i < 20 && maxQ - minQ > 1; i++) {
    const quality = Math.floor((minQ + maxQ) / 2);
    const size = await estimateCompressedSize(imageDataUrl, quality);
    const diff = Math.abs(size - targetSize);

    // Track best result
    if (diff < bestSizeDiff) {
      bestSizeDiff = diff;
      bestQuality = quality;
      bestSize = size;
    }

    // Stop if we're very close
    if (diff <= tolerance) {
      return { 
        quality: quality,
        actualSize: size,
        isExact: true
      };
    }

    if (size > targetSize) {
      maxQ = quality;
    } else {
      minQ = quality;
    }
  }

  // If we couldn't get exact target, step down quality from best result
  if (bestSize > targetSize) {
    for (let q = bestQuality - 1; q >= 1; q--) {
      const size = await estimateCompressedSize(imageDataUrl, q);
      if (size <= targetSize) {
        return { 
          quality: q,
          actualSize: size,
          isExact: Math.abs(size - targetSize) <= tolerance
        };
      }
    }
  }

  // Return best approximation found
  return { 
    quality: bestQuality,
    actualSize: bestSize,
    isExact: Math.abs(bestSize - targetSize) <= tolerance
  };
};


const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

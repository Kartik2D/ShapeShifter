// Image processing service for blur effect

export interface ProcessingOptions {
  blurAmount: number;
}

/**
 * Applies blur effect to ImageData using canvas filter
 */
export function applyBlur(
  imageData: ImageData,
  blurAmount: number
): ImageData {
  if (blurAmount <= 0) {
    return imageData;
  }

  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d')!;

  // First, put the original image data
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);

  // Apply blur filter and draw
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(tempCanvas, 0, 0);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Creates a preview canvas element with the processed image
 */
export function createPreviewCanvas(
  imageData: ImageData,
  blurAmount: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d')!;

  // Draw original first
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);

  // Apply blur
  if (blurAmount > 0) {
    ctx.filter = `blur(${blurAmount}px)`;
  }
  ctx.drawImage(tempCanvas, 0, 0);

  return canvas;
}

/**
 * Converts ImageData to a Blob for potential file operations
 */
export function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/png');
  });
}


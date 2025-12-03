// Shape tracer service wrapping esm-potrace-wasm

import { potrace, init } from 'esm-potrace-wasm';

let initialized = false;

export interface TraceOptions {
  posterizeLevel: number; // 1-255, controls color reduction
  turdSize: number; // removes speckles smaller than this
  extractColors: boolean;
}

const defaultOptions: TraceOptions = {
  posterizeLevel: 4,
  turdSize: 2,
  extractColors: true,
};

/**
 * Initialize the potrace WASM module
 * Must be called before tracing
 */
export async function initTracer(): Promise<void> {
  if (!initialized) {
    console.log('Loading potrace WASM module...');
    try {
      await init();
      initialized = true;
      console.log('Potrace WASM module loaded successfully');
    } catch (err) {
      console.error('Failed to load potrace WASM:', err);
      throw err;
    }
  }
}

/**
 * Trace ImageData into SVG string
 */
export async function traceToSvg(
  imageData: ImageData,
  options: Partial<TraceOptions> = {}
): Promise<string> {
  await initTracer();

  const opts = { ...defaultOptions, ...options };

  // Create a canvas with the image data to pass to potrace
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);

  console.log('Calling potrace with options:', {
    turdsize: opts.turdSize,
    posterizelevel: opts.posterizeLevel,
    canvasSize: `${canvas.width}x${canvas.height}`
  });

  try {
    const svg = await potrace(canvas, {
      turdsize: opts.turdSize,
      turnpolicy: 4, // TURNPOLICY_MINORITY
      alphamax: 1,
      opticurve: 1,
      opttolerance: 0.2,
      pathonly: false,
      extractcolors: opts.extractColors,
      posterizelevel: opts.posterizeLevel,
      posterizationalgorithm: 0, // simple
    });

    console.log('Potrace returned SVG, length:', svg?.length);
    return svg;
  } catch (err) {
    console.error('Potrace tracing failed:', err);
    throw err;
  }
}

/**
 * Trace with blur pre-applied
 */
export async function traceWithProcessing(
  imageData: ImageData,
  blurAmount: number,
  posterizeLevel: number
): Promise<string> {
  // Apply blur first
  const processedCanvas = document.createElement('canvas');
  processedCanvas.width = imageData.width;
  processedCanvas.height = imageData.height;
  const ctx = processedCanvas.getContext('2d')!;

  // Put original image
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

  // Get processed image data
  const processedData = ctx.getImageData(
    0,
    0,
    processedCanvas.width,
    processedCanvas.height
  );

  return traceToSvg(processedData, { posterizeLevel });
}


// Blob Factory - Creates animated SVG blobs with scale and hover effects

export interface BlobConfig {
  color: string;
  centerX?: number;
  centerY?: number;
  radiusX: number;
  radiusY: number;
  opacity?: number;
  jiggleIntensity?: number;
  numPoints?: number;
}

export interface BlobInstance {
  svg: SVGSVGElement;
  setJiggleIntensity: (intensity: number) => void;
  setColor: (color: string) => void;
  setScale: (scale: number) => void;
  getScale: () => number;
  destroy: () => void;
}

export function createBlob(config: BlobConfig): BlobInstance {
  const {
    color,
    centerX = 100,
    centerY = 100,
    radiusX,
    radiusY,
    opacity = 1,
    jiggleIntensity = 2,
    numPoints = 8
  } = config;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.overflow = 'visible';
  svg.style.transformOrigin = 'center center';
  svg.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';

  // Generate blob points
  const points: Array<{ baseX: number; baseY: number; x: number; y: number }> = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const variation = 0.7 + Math.random() * 0.3;
    const x = centerX + Math.cos(angle) * radiusX * variation;
    const y = centerY + Math.sin(angle) * radiusY * variation;
    points.push({ baseX: x, baseY: y, x, y });
  }

  // Create path
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', color);
  path.setAttribute('opacity', String(opacity));
  svg.appendChild(path);

  // Update path from points
  const updatePath = () => {
    let d = `M ${points[0].x} ${points[0].y} `;
    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      const next = points[(i + 1) % points.length];
      const cp1x = curr.x + (next.x - curr.x) * 0.5;
      const cp1y = curr.y + (next.y - curr.y) * 0.5;
      d += `Q ${cp1x} ${cp1y} ${next.x} ${next.y} `;
    }
    d += 'Z';
    path.setAttribute('d', d);
  };

  // Animation state
  let currentJiggleIntensity = jiggleIntensity;
  let currentScale = 1;
  let animationId: number | null = null;
  let isDestroyed = false;

  // Jiggle animation
  const animate = () => {
    if (isDestroyed) return;
    
    points.forEach(p => {
      p.x = p.baseX + (Math.random() - 0.5) * currentJiggleIntensity;
      p.y = p.baseY + (Math.random() - 0.5) * currentJiggleIntensity;
    });
    updatePath();
    animationId = requestAnimationFrame(animate);
  };
  animate();

  const setJiggleIntensity = (intensity: number) => {
    currentJiggleIntensity = intensity;
  };

  const setColor = (newColor: string) => {
    path.setAttribute('fill', newColor);
  };

  const setScale = (scale: number) => {
    currentScale = scale;
    svg.style.transform = `scale(${scale})`;
  };

  const getScale = () => currentScale;

  const destroy = () => {
    isDestroyed = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };

  return { svg, setJiggleIntensity, setColor, setScale, getScale, destroy };
}

// Create a blob button with optional inner icon/shape
export interface BlobButtonConfig {
  color: string;
  size?: number;
  jiggleIntensity?: number;
}

export function createBlobButton(config: BlobButtonConfig): BlobInstance {
  const { color, size = 200, jiggleIntensity = 3 } = config;
  
  return createBlob({
    color,
    centerX: 100,
    centerY: 100,
    radiusX: size * 0.4 + Math.random() * size * 0.1,
    radiusY: size * 0.4 + Math.random() * size * 0.1,
    jiggleIntensity
  });
}

// Create reset button blob with triangle inside
export interface ResetBlobConfig {
  color: string;
  triangleColor?: string;
}

export function createResetBlob(config: ResetBlobConfig): BlobInstance {
  const { color, triangleColor = PALETTE.icon } = config;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.overflow = 'visible';
  svg.style.transformOrigin = 'center center';
  svg.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';

  const centerX = 100;
  const centerY = 100;
  const radiusX = 200 * (0.55 + Math.random() * 0.1);
  const radiusY = 200 * (0.55 + Math.random() * 0.1);

  // Blob points
  const blobPoints: Array<{ baseX: number; baseY: number; x: number; y: number }> = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const variation = 0.7 + Math.random() * 0.3;
    blobPoints.push({
      baseX: centerX + Math.cos(angle) * radiusX * variation,
      baseY: centerY + Math.sin(angle) * radiusY * variation,
      x: 0, y: 0
    });
  }

  const blobPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  blobPath.setAttribute('fill', color);
  svg.appendChild(blobPath);

  // Triangle points
  const triangleRotation = Math.random() * Math.PI * 2;
  const triangleSize = 25;
  const trianglePoints: Array<{ baseX: number; baseY: number; x: number; y: number }> = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + triangleRotation + (Math.random() - 0.5) * 0.3;
    const size = triangleSize * (0.8 + Math.random() * 0.4);
    trianglePoints.push({
      baseX: centerX + Math.cos(angle) * size,
      baseY: centerY + Math.sin(angle) * size,
      x: 0, y: 0
    });
  }

  const trianglePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  trianglePath.setAttribute('fill', triangleColor);
  trianglePath.setAttribute('opacity', '0.9');
  svg.appendChild(trianglePath);

  const updateBlobPath = () => {
    let d = `M ${blobPoints[0].x} ${blobPoints[0].y} `;
    for (let i = 0; i < blobPoints.length; i++) {
      const curr = blobPoints[i];
      const next = blobPoints[(i + 1) % blobPoints.length];
      d += `Q ${curr.x + (next.x - curr.x) * 0.5} ${curr.y + (next.y - curr.y) * 0.5} ${next.x} ${next.y} `;
    }
    blobPath.setAttribute('d', d + 'Z');
  };

  const updateTrianglePath = () => {
    trianglePath.setAttribute('d', 
      `M ${trianglePoints[0].x} ${trianglePoints[0].y} L ${trianglePoints[1].x} ${trianglePoints[1].y} L ${trianglePoints[2].x} ${trianglePoints[2].y} Z`
    );
  };

  let currentJiggleIntensity = 3;
  let currentScale = 1;
  let animationId: number | null = null;
  let isDestroyed = false;

  const animate = () => {
    if (isDestroyed) return;
    
    blobPoints.forEach(p => {
      p.x = p.baseX + (Math.random() - 0.5) * currentJiggleIntensity;
      p.y = p.baseY + (Math.random() - 0.5) * currentJiggleIntensity;
    });
    trianglePoints.forEach(p => {
      p.x = p.baseX + (Math.random() - 0.5) * currentJiggleIntensity;
      p.y = p.baseY + (Math.random() - 0.5) * currentJiggleIntensity;
    });
    updateBlobPath();
    updateTrianglePath();
    animationId = requestAnimationFrame(animate);
  };
  animate();

  const setJiggleIntensity = (intensity: number) => {
    currentJiggleIntensity = intensity;
  };

  const setColor = (newColor: string) => {
    blobPath.setAttribute('fill', newColor);
  };

  const setScale = (scale: number) => {
    currentScale = scale;
    svg.style.transform = `scale(${scale})`;
  };

  const getScale = () => currentScale;

  const destroy = () => {
    isDestroyed = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };

  return { svg, setJiggleIntensity, setColor, setScale, getScale, destroy };
}

// Helper to add grow-on-hover effect to a blob
export function addHoverEffect(
  blob: BlobInstance, 
  element: HTMLElement,
  options: {
    hoverScale?: number;
    hoverJiggle?: number;
    normalJiggle?: number;
  } = {}
): () => void {
  const { hoverScale = 1.15, hoverJiggle = 8, normalJiggle = 3 } = options;

  const onEnter = () => {
    blob.setScale(hoverScale);
    blob.setJiggleIntensity(hoverJiggle);
  };

  const onLeave = () => {
    blob.setScale(1);
    blob.setJiggleIntensity(normalJiggle);
  };

  element.addEventListener('mouseenter', onEnter);
  element.addEventListener('mouseleave', onLeave);

  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', onEnter);
    element.removeEventListener('mouseleave', onLeave);
  };
}

// ============================================
// RESERVED COLOR PALETTE
// ============================================

// Background color - NEVER use for blobs
export const BACKGROUND = '#2b2821';

// Blob colors - guaranteed to contrast with background
// These are mid-to-bright tones that stand out against the dark background
export const BLOB_PALETTE = [
  '#d4804d', // warm orange (primary accent)
  '#5c8b93', // teal
  '#b03a48', // deep red
  '#3e6958', // forest green
  '#624c3c', // warm brown
  '#5d7275', // slate gray
  '#d9ac8b', // sand/peach
  '#e0c872', // golden yellow
] as const;

// Icon color - light cream that works on ALL blob colors
export const ICON_COLOR = '#e3cfb4';

// Alternative icon for dark elements (export button uses dark icon on light blob)
export const ICON_COLOR_DARK = '#2b2821';

// Decorative blob color (low opacity backgrounds)
export const DECO_COLOR = '#d4804d';

// Unified palette object for easy access
export const PALETTE = {
  background: BACKGROUND,
  icon: ICON_COLOR,
  iconDark: ICON_COLOR_DARK,
  deco: DECO_COLOR,
  blobs: BLOB_PALETTE,
  // Named blob colors for specific uses
  primary: '#d4804d',    // Main accent - orange
  secondary: '#5c8b93',  // Secondary - teal  
  tertiary: '#624c3c',   // Muted - brown
  success: '#3e6958',    // Success - green
  danger: '#b03a48',     // Danger - red
  neutral: '#5d7275',    // Neutral - slate
} as const;

// Get a blob color by index (cycles through palette)
export function getBlobColor(index: number): string {
  return BLOB_PALETTE[index % BLOB_PALETTE.length];
}

// Get a random blob color (never returns background color)
export function getRandomBlobColor(): string {
  return BLOB_PALETTE[Math.floor(Math.random() * BLOB_PALETTE.length)];
}

// Legacy exports for backward compatibility
export const BLOB_COLORS = BLOB_PALETTE;

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomColor(): string {
  return getRandomBlobColor();
}

import { UIComponent, ProcessingOptions } from '../types';

/**
 * Loads an image from a File object.
 */
export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Connected Component Labeling (Flood Fill approach) to find non-transparent islands.
 * Warning: Computationally expensive for very large images. 
 * Optimized with 1D array access and iterative stack to prevent stack overflow.
 */
export const detectComponents = (
  img: HTMLImageElement,
  fileName: string,
  options: ProcessingOptions = { threshold: 10, minArea: 50, padding: 2 },
  startIndex: number = 0
): UIComponent[] => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) throw new Error('Could not get 2D context');
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { width, height, data } = imageData;
  
  // Visited array: 0 = unvisited, 1 = visited
  const visited = new Uint8Array(width * height);
  const components: UIComponent[] = [];
  
  // Helper to check transparency
  // Index in data array is (y * width + x) * 4 + 3 (Alpha channel)
  const isSolid = (idx: number) => data[idx * 4 + 3] > options.threshold;

  // Directions for neighbor search (4-connectivity)
  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (visited[idx] || !isSolid(idx)) continue;

      // Start new component discovery
      let minX = x, maxX = x, minY = y, maxY = y;
      const stack = [idx];
      visited[idx] = 1;
      let pixelCount = 0;

      while (stack.length > 0) {
        const currentIdx = stack.pop()!;
        const cy = Math.floor(currentIdx / width);
        const cx = currentIdx % width;
        
        pixelCount++;

        // Update bounds
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // Check neighbors
        for (let i = 0; i < 4; i++) {
          const nx = cx + dx[i];
          const ny = cy + dy[i];

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx] && isSolid(nIdx)) {
              visited[nIdx] = 1;
              stack.push(nIdx);
            }
          }
        }
      }

      // Filter noise
      if (pixelCount >= options.minArea) {
        // Add padding
        minX = Math.max(0, minX - options.padding);
        minY = Math.max(0, minY - options.padding);
        maxX = Math.min(width, maxX + options.padding);
        maxY = Math.min(height, maxY + options.padding);
        
        const compWidth = maxX - minX;
        const compHeight = maxY - minY;

        // Extract image data for this component
        const compCanvas = document.createElement('canvas');
        compCanvas.width = compWidth;
        compCanvas.height = compHeight;
        const compCtx = compCanvas.getContext('2d');
        
        if (compCtx) {
          compCtx.drawImage(
            canvas,
            minX, minY, compWidth, compHeight, // Source
            0, 0, compWidth, compHeight        // Dest
          );
          
          components.push({
            id: `comp_${Date.now()}_${startIndex + components.length}`,
            name: `Component ${startIndex + components.length + 1}`,
            imageBase64: compCanvas.toDataURL(),
            x: minX,
            y: minY,
            width: compWidth,
            height: compHeight,
            originalX: minX,
            originalY: minY,
            originalWidth: compWidth,
            originalHeight: compHeight,
            importTime: Date.now(),
            sourceFileName: fileName
          });
        }
      }
    }
  }

  if (components.length === 0) {
    return [{
      id: `comp_${Date.now()}_0`,
      name: fileName,
      imageBase64: canvas.toDataURL(),
      x: 0,
      y: 0,
      width: width,
      height: height,
      originalX: 0,
      originalY: 0,
      originalWidth: width,
      originalHeight: height,
      importTime: Date.now(),
      sourceFileName: fileName
    }];
  }

  return components;
};

/**
 * Renders a component to a canvas at a specific size, supporting 9-slice scaling.
 */
export const renderScaledComponent = async (component: UIComponent): Promise<string> => {
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = component.imageBase64;
  });

  const canvas = document.createElement('canvas');
  canvas.width = component.width;
  canvas.height = component.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  if (component.scaleMode === 'nine-slice') {
    const slice = component.nineSlice || { left: 10, right: 10, top: 10, bottom: 10 };
    const sw = component.originalWidth;
    const sh = component.originalHeight;
    const dw = component.width;
    const dh = component.height;

    // Source coordinates
    const sx = [0, slice.left, sw - slice.right, sw];
    const sy = [0, slice.top, sh - slice.bottom, sh];

    // Destination coordinates
    const dx = [0, slice.left, dw - slice.right, dw];
    const dy = [0, slice.top, dh - slice.bottom, dh];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const sWidth = sx[col + 1] - sx[col];
        const sHeight = sy[row + 1] - sy[row];
        const dWidth = dx[col + 1] - dx[col];
        const dHeight = dy[row + 1] - dy[row];

        if (sWidth > 0 && sHeight > 0 && dWidth > 0 && dHeight > 0) {
          ctx.drawImage(
            img,
            sx[col], sy[row], sWidth, sHeight,
            dx[col], dy[row], dWidth, dHeight
          );
        }
      }
    }
  } else {
    // Proportional or standard stretch
    ctx.drawImage(img, 0, 0, component.width, component.height);
  }

  return canvas.toDataURL();
};

/**
 * Creates a transparent 60x60 image with a dashed outline.
 */
export const createPlaceholderImage = (width: number = 60, height: number = 60): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // Draw dashed outline
  ctx.strokeStyle = '#64748b'; // slate-500
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  return canvas.toDataURL();
};

/**
 * Creates a bitmap image from text.
 */
export const createTextImage = (text: string, fontSize: number, fontFamily: string, color: string): { dataUrl: string, width: number, height: number } => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  
  // Calculate height more accurately
  const fontHeight = fontSize; 
  const width = Math.ceil(metrics.width) || 10;
  const height = Math.ceil(fontHeight * 1.2) || 10;

  canvas.width = width;
  canvas.height = height;

  // Re-set font after resizing canvas
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, height / 2);

  return {
    dataUrl: canvas.toDataURL(),
    width,
    height
  };
};

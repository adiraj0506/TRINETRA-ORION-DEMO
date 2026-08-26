/**
 * Client-side canvas preprocessing utility for OCR optimization.
 * Performs grayscale conversion, contrast enhancement, dynamic Otsu binarization,
 * and crops margins to remove spiral binding rings, shadows, and dark page borders.
 */
export function preprocessImage(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL();

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // 1. Grayscale conversion and histogram computation
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    
    // Contrast boost: Stretch histogram range slightly
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    histogram[gray]++;
  }

  // 2. Otsu's Thresholding to find the optimal binary split point
  const total = data.length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 127; // Fallback default

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  // Apply binarization threshold
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i];
    const binary = gray < threshold ? 0 : 255;
    data[i] = binary;
    data[i + 1] = binary;
    data[i + 2] = binary;
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Margin crop: Auto-crop borders to eliminate spiral binding noise (usually left margin) and frames
  const cropLeft = Math.round(canvas.width * 0.075); // 7.5% from left (cuts out binder rings/holes)
  const cropRight = Math.round(canvas.width * 0.04); // 4% from right
  const cropTop = Math.round(canvas.height * 0.03);   // 3% from top
  const cropBottom = Math.round(canvas.height * 0.03); // 3% from bottom

  const croppedWidth = canvas.width - cropLeft - cropRight;
  const croppedHeight = canvas.height - cropTop - cropBottom;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = croppedWidth;
  tempCanvas.height = croppedHeight;
  const tempCtx = tempCanvas.getContext("2d")!;

  tempCtx.drawImage(
    canvas,
    cropLeft,
    cropTop,
    croppedWidth,
    croppedHeight,
    0,
    0,
    croppedWidth,
    croppedHeight
  );

  return tempCanvas.toDataURL("image/png");
}

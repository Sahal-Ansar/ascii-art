/**
 * ASCII Art Rendering Engine
 * Deterministic: same input + same settings = identical output
 * No randomness, no AI — pure algorithmic brightness-to-character mapping
 */

// Character set presets ordered by visual density (dark → light)
export const CHAR_PRESETS = {
  simple: ' .:-=+*#%@',
  complex: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  binary: ' 01',
  blocks: ' ░▒▓█',
  dots: ' ·•●',
  minimal: ' .-+*#',
};

/**
 * Compute luminance from RGB using Rec. 709 coefficients
 * This is the standard perceptual luminance formula
 */
export function getLuminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Apply brightness and contrast adjustments
 * @param {number} value - input luminance [0,255]
 * @param {number} brightness - brightness offset [-100,100]
 * @param {number} contrast - contrast multiplier [-100,100]
 * @returns {number} adjusted value clamped to [0,255]
 */
export function applyAdjustments(value, brightness, contrast) {
  // Contrast: scale around midpoint 128
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  let adjusted = contrastFactor * (value - 128) + 128;
  // Brightness: linear offset
  adjusted += brightness * 2.55;
  return Math.max(0, Math.min(255, adjusted));
}

/**
 * Map a brightness value [0,255] to a character from the charset
 * @param {number} brightness - brightness value [0,255]
 * @param {string} charset - the character set string
 * @param {boolean} invert - if true, invert the mapping
 * @returns {string} the mapped character
 */
export function brightnessToChar(brightness, charset, invert = false) {
  const len = charset.length;
  if (len === 0) return ' ';
  const b = invert ? 255 - brightness : brightness;
  const index = Math.floor((b / 255) * (len - 1));
  return charset[Math.max(0, Math.min(len - 1, index))];
}

/**
 * Process image data into an ASCII grid
 * @param {ImageData} imageData - raw pixel data
 * @param {number} srcWidth - source width
 * @param {number} srcHeight - source height
 * @param {number} cols - desired output columns
 * @param {number} rows - desired output rows
 * @param {string} charset - character set
 * @param {number} brightness - brightness adjustment
 * @param {number} contrast - contrast adjustment
 * @param {boolean} invert - invert brightness mapping
 * @returns {{ chars: string[][], colors: [number,number,number][][] }}
 */
export function processToAsciiGrid(
  imageData,
  srcWidth,
  srcHeight,
  cols,
  rows,
  charset,
  brightness = 0,
  contrast = 0,
  invert = false
) {
  const data = imageData.data;
  const cellW = srcWidth / cols;
  const cellH = srcHeight / rows;

  const chars = [];
  const colors = [];

  for (let row = 0; row < rows; row++) {
    const charRow = [];
    const colorRow = [];
    for (let col = 0; col < cols; col++) {
      // Sample from center of cell for best representation
      const sx = Math.floor(col * cellW + cellW / 2);
      const sy = Math.floor(row * cellH + cellH / 2);
      const idx = (sy * srcWidth + sx) * 4;

      const r = data[idx] || 0;
      const g = data[idx + 1] || 0;
      const b = data[idx + 2] || 0;

      const lum = getLuminance(r, g, b);
      const adjusted = applyAdjustments(lum, brightness, contrast);
      const ch = brightnessToChar(adjusted, charset, invert);

      charRow.push(ch);
      colorRow.push([r, g, b]);
    }
    chars.push(charRow);
    colors.push(colorRow);
  }

  return { chars, colors };
}

/**
 * Apply edge detection (Sobel operator) for edge mode
 */
export function applyEdgeDetection(imageData, width, height) {
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Sobel kernels
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const lum = getLuminance(src[idx], src[idx + 1], src[idx + 2]);
          const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
          const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
          gx += lum * sobelX[ky + 1][kx + 1];
          gy += lum * sobelY[ky + 1][kx + 1];
        }
      }
      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const i = (y * width + x) * 4;
      out[i] = mag;
      out[i + 1] = mag;
      out[i + 2] = mag;
      out[i + 3] = 255;
    }
  }

  return new ImageData(out, width, height);
}

/**
 * Color utilities for ASCII art rendering
 * Handles color modes: monochrome, full color, gradient
 */

/**
 * Convert HSV to RGB
 * @param {number} h - hue [0,360]
 * @param {number} s - saturation [0,1]
 * @param {number} v - value [0,1]
 * @returns {[number,number,number]} RGB values [0,255]
 */
export function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1, g1, b1;

  if (h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

/**
 * Convert RGB to HSV
 * @param {number} r [0,255]
 * @param {number} g [0,255]
 * @param {number} b [0,255]
 * @returns {{ h: number, s: number, v: number }}
 */
export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  return { h, s, v };
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return [255, 255, 255];
  return m.map(c => parseInt(c, 16));
}

/**
 * Interpolate between colors based on brightness
 * @param {number} t - interpolation factor [0,1]
 * @param {Array<[number,number,number]>} stops - color stops RGB
 * @returns {[number,number,number]} interpolated RGB
 */
export function interpolateGradient(t, stops) {
  if (stops.length === 0) return [255, 255, 255];
  if (stops.length === 1) return stops[0];

  const segmentCount = stops.length - 1;
  const segment = Math.min(Math.floor(t * segmentCount), segmentCount - 1);
  const localT = (t * segmentCount) - segment;

  const c1 = stops[segment];
  const c2 = stops[segment + 1];

  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * localT),
    Math.round(c1[1] + (c2[1] - c1[1]) * localT),
    Math.round(c1[2] + (c2[2] - c1[2]) * localT),
  ];
}

/**
 * Get color for a character based on color mode
 * @param {'monochrome'|'fullcolor'|'gradient'} mode
 * @param {[number,number,number]} originalColor - original pixel RGB
 * @param {number} brightness - pixel brightness [0,255]
 * @param {[number,number,number]} monoColor - monochrome color
 * @param {Array<[number,number,number]>} gradientStops - gradient colors
 * @returns {string} CSS color string
 */
export function getCharColor(mode, originalColor, brightness, monoColor, gradientStops) {
  switch (mode) {
    case 'fullcolor':
      return `rgb(${originalColor[0]},${originalColor[1]},${originalColor[2]})`;
    case 'gradient':
      const gc = interpolateGradient(brightness / 255, gradientStops);
      return `rgb(${gc[0]},${gc[1]},${gc[2]})`;
    case 'monochrome':
    default:
      return `rgb(${monoColor[0]},${monoColor[1]},${monoColor[2]})`;
  }
}

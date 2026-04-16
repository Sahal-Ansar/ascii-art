/**
 * Export utilities for ASCII art
 * Supports PNG, JPG, TXT, and HTML export formats
 * Uses Blob-based downloads for reliable file format and naming
 */

/**
 * Crop a canvas to specific bounds, returning a new canvas
 * @param {HTMLCanvasElement} canvas - source canvas
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @returns {HTMLCanvasElement} cropped canvas
 */
function cropCanvas(canvas, bounds) {
  if (!bounds) return canvas;
  const cropped = document.createElement('canvas');
  cropped.width = bounds.width;
  cropped.height = bounds.height;
  const ctx = cropped.getContext('2d');
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, bounds.width, bounds.height);
  ctx.drawImage(
    canvas,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height
  );
  return cropped;
}

/**
 * Trigger a blob download
 */
function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export canvas as PNG and trigger download
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 * @param {{ x: number, y: number, width: number, height: number }} [bounds] - crop to ASCII area
 */
export function exportAsPng(canvas, filename, bounds) {
  const target = cropCanvas(canvas, bounds);
  target.toBlob((blob) => {
    downloadBlob(blob, filename || `ascii_capture_${Date.now()}.png`);
  }, 'image/png');
}

/**
 * Export canvas as JPG and trigger download
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 * @param {{ x: number, y: number, width: number, height: number }} [bounds] - crop to ASCII area
 * @param {number} quality - JPEG quality 0-1 (default 0.92)
 */
export function exportAsJpg(canvas, filename, bounds, quality = 0.92) {
  const target = cropCanvas(canvas, bounds);
  // JPG needs opaque background (no transparency)
  const temp = document.createElement('canvas');
  temp.width = target.width;
  temp.height = target.height;
  const ctx = temp.getContext('2d');
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, temp.width, temp.height);
  ctx.drawImage(target, 0, 0);

  temp.toBlob((blob) => {
    downloadBlob(blob, filename || `ascii_capture_${Date.now()}.jpg`);
  }, 'image/jpeg', quality);
}

/**
 * Export ASCII grid as plain text
 * @param {string[][]} chars - 2D array of characters
 * @param {string} filename
 */
export function exportAsTxt(chars, filename) {
  const text = chars.map(row => row.join('')).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const link = document.createElement('a');
  link.download = filename || `ascii_capture_${Date.now()}.txt`;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Export colored ASCII as HTML file
 * @param {string[][]} chars
 * @param {string[][]} colorStrings - 2D array of CSS color strings
 * @param {string} bgColor
 * @param {number} fontSize
 * @param {string} filename
 */
export function exportAsHtml(chars, colorStrings, bgColor, fontSize, filename) {
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ASCII Art</title>
<style>
body {
  background: ${bgColor};
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
}
pre {
  font-family: 'Courier New', monospace;
  font-size: ${fontSize}px;
  line-height: 1;
  letter-spacing: 0;
}
</style>
</head>
<body>
<pre>`;

  for (let r = 0; r < chars.length; r++) {
    for (let c = 0; c < chars[r].length; c++) {
      const ch = chars[r][c] === ' ' ? '&nbsp;' : chars[r][c].replace(/[<>&"]/g, e => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'
      })[e]);
      html += `<span style="color:${colorStrings[r]?.[c] || '#fff'}">${ch}</span>`;
    }
    html += '\n';
  }

  html += '</pre></body></html>';

  const blob = new Blob([html], { type: 'text/html' });
  const link = document.createElement('a');
  link.download = filename || `ascii_capture_${Date.now()}.html`;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

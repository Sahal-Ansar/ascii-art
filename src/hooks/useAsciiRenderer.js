import { useRef, useCallback, useEffect } from 'react';
import { processToAsciiGrid, applyEdgeDetection, getLuminance, applyAdjustments } from '../utils/ascii';
import { getCharColor } from '../utils/color';

/**
 * Core ASCII rendering hook
 * Handles the full render pipeline for both camera and image modes
 * Uses canvas 2D for maximum compatibility
 */
export function useAsciiRenderer({
  charset,
  colorMode,
  monoColor,
  gradientStops,
  brightness,
  contrast,
  fontSize,
  invert,
  edgeDetect,
  performanceMode,
}) {
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastGridRef = useRef(null);
  const renderBoundsRef = useRef(null);

  // Ensure offscreen canvas exists
  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  /**
   * Render a single frame of ASCII art from a source (video or image element)
   */
  const renderFrame = useCallback((source, sourceWidth, sourceHeight) => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const offscreen = offscreenCanvasRef.current || document.createElement('canvas');
    offscreenCanvasRef.current = offscreen;

    // Determine character dimensions
    ctx.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
    const charMetrics = ctx.measureText('M');
    const charWidth = charMetrics.width;
    const charHeight = fontSize * 1.1;

    // Calculate grid dimensions preserving source aspect ratio
    const maxCols = Math.floor(canvas.width / charWidth);
    const maxRows = Math.floor(canvas.height / charHeight);

    if (maxCols <= 0 || maxRows <= 0) return;

    // Compute aspect-correct grid: account for character cell aspect ratio
    const imageAspect = sourceWidth / sourceHeight;
    const charAspect = charWidth / charHeight;
    const targetColRowRatio = imageAspect / charAspect;

    let cols, rows;
    if (targetColRowRatio > maxCols / maxRows) {
      // Width-constrained
      cols = maxCols;
      rows = Math.max(1, Math.floor(cols / targetColRowRatio));
    } else {
      // Height-constrained
      rows = maxRows;
      cols = Math.max(1, Math.floor(rows * targetColRowRatio));
    }

    // Center offset
    const offsetX = Math.floor((canvas.width - cols * charWidth) / 2);
    const offsetY = Math.floor((canvas.height - rows * charHeight) / 2);

    // Store render bounds for cropped export
    const contentWidth = Math.ceil(cols * charWidth);
    const contentHeight = Math.ceil(rows * charHeight);
    renderBoundsRef.current = { x: offsetX, y: offsetY, width: contentWidth, height: contentHeight };

    // Draw source to offscreen canvas at appropriate resolution
    offscreen.width = sourceWidth;
    offscreen.height = sourceHeight;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    offCtx.drawImage(source, 0, 0, sourceWidth, sourceHeight);

    let imageData = offCtx.getImageData(0, 0, sourceWidth, sourceHeight);

    // Apply edge detection if enabled
    if (edgeDetect) {
      imageData = applyEdgeDetection(imageData, sourceWidth, sourceHeight);
    }

    // Process to ASCII grid
    const grid = processToAsciiGrid(
      imageData, sourceWidth, sourceHeight,
      cols, rows,
      charset, brightness, contrast, invert
    );

    lastGridRef.current = grid;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render ASCII characters
    ctx.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
    ctx.textBaseline = 'top';

    if (colorMode === 'monochrome') {
      // Batch render for monochrome mode (faster)
      ctx.fillStyle = `rgb(${monoColor[0]},${monoColor[1]},${monoColor[2]})`;
      for (let r = 0; r < rows; r++) {
        const line = grid.chars[r].join('');
        ctx.fillText(line, offsetX, offsetY + r * charHeight);
      }
    } else {
      // Per-character rendering for color modes
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid.chars[r][c] === ' ') continue;
          const origColor = grid.colors[r][c];
          const lum = getLuminance(origColor[0], origColor[1], origColor[2]);
          const adjLum = applyAdjustments(lum, brightness, contrast);

          ctx.fillStyle = getCharColor(
            colorMode, origColor, adjLum, monoColor, gradientStops
          );
          ctx.fillText(grid.chars[r][c], offsetX + c * charWidth, offsetY + r * charHeight);
        }
      }
    }

    return grid;
  }, [charset, colorMode, monoColor, gradientStops, brightness, contrast, fontSize, invert, edgeDetect]);

  /**
   * Start continuous rendering loop for camera mode
   */
  const startRenderLoop = useCallback((videoElement) => {
    const fpsLimits = { high: 30, balanced: 20, performance: 12 };
    const targetFps = fpsLimits[performanceMode] || 20;
    const frameInterval = 1000 / targetFps;
    let lastTime = 0;

    const loop = (timestamp) => {
      if (timestamp - lastTime >= frameInterval) {
        lastTime = timestamp;
        if (videoElement.readyState >= 2) {
          renderFrame(videoElement, videoElement.videoWidth, videoElement.videoHeight);
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [renderFrame, performanceMode]);

  /**
   * Stop the render loop
   */
  const stopRenderLoop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  /**
   * Render a single image (for upload mode)
   */
  const renderImage = useCallback((imageElement) => {
    return renderFrame(imageElement, imageElement.naturalWidth || imageElement.width, imageElement.naturalHeight || imageElement.height);
  }, [renderFrame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return {
    canvasRef,
    renderFrame,
    renderImage,
    startRenderLoop,
    stopRenderLoop,
    lastGridRef,
    renderBoundsRef,
  };
}

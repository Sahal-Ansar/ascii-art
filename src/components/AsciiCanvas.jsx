import React, { useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * ASCII Canvas
 * Full-screen canvas that displays the rendered ASCII art
 * Handles resize and provides capture functionality
 */
const AsciiCanvas = forwardRef(function AsciiCanvas({ canvasRef, onResize }, ref) {
  const containerRef = useRef(null);

  // Resize canvas to fill container
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = 1; // We use logical pixels for ASCII
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    if (onResize) onResize(canvas.width, canvas.height);
  }, [canvasRef, onResize]);

  useEffect(() => {
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [handleResize]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  return (
    <div className="ascii-canvas-container" ref={containerRef} id="ascii-canvas-container">
      <canvas ref={canvasRef} className="ascii-canvas" id="ascii-canvas" />
    </div>
  );
});

export default AsciiCanvas;

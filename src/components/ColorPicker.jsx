import React, { useState, useRef, useCallback, useEffect } from 'react';
import { hsvToRgb, rgbToHsv, rgbToHex } from '../utils/color';

/**
 * HSV Color Wheel Picker
 * Full color wheel with saturation/value, live preview
 * Touch-friendly for mobile
 */
export default function ColorPicker({ color, onChange, label }) {
  const wheelRef = useRef(null);
  const stripRef = useRef(null);
  const [hsv, setHsv] = useState(() => {
    const { h, s, v } = rgbToHsv(color[0], color[1], color[2]);
    return { h, s, v };
  });
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    const { h, s, v } = rgbToHsv(color[0], color[1], color[2]);
    setHsv({ h, s, v });
  }, [color]);

  // Draw the SV square
  const drawWheel = useCallback(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;

    // Draw saturation-value plane
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const s = x / size;
        const v = 1 - y / size;
        const [r, g, b] = hsvToRgb(hsv.h, s, v);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hsv.h]);

  // Draw hue strip
  const drawStrip = useCallback(() => {
    const canvas = stripRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const h = canvas.height;

    for (let y = 0; y < h; y++) {
      const hue = (y / h) * 360;
      const [r, g, b] = hsvToRgb(hue, 1, 1);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, canvas.width, 1);
    }
  }, []);

  useEffect(() => {
    drawWheel();
    drawStrip();
  }, [drawWheel, drawStrip]);

  const handleWheelInteraction = useCallback((e) => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const newHsv = { ...hsv, s: x, v: 1 - y };
    setHsv(newHsv);
    onChange(hsvToRgb(newHsv.h, newHsv.s, newHsv.v));
  }, [hsv, onChange]);

  const handleStripInteraction = useCallback((e) => {
    const canvas = stripRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const newHsv = { ...hsv, h: y * 360 };
    setHsv(newHsv);
    onChange(hsvToRgb(newHsv.h, newHsv.s, newHsv.v));
  }, [hsv, onChange]);

  // Mouse/touch events
  const onWheelDown = (e) => {
    e.preventDefault();
    setDragging('wheel');
    handleWheelInteraction(e);
  };
  const onStripDown = (e) => {
    e.preventDefault();
    setDragging('strip');
    handleStripInteraction(e);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (dragging === 'wheel') handleWheelInteraction(e);
      else if (dragging === 'strip') handleStripInteraction(e);
    };
    const onUp = () => setDragging(null);

    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, handleWheelInteraction, handleStripInteraction]);

  const size = 160;
  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);

  return (
    <div className="color-picker" id={`color-picker-${label?.replace(/\s/g, '-')}`}>
      {label && <label className="control-label">{label}</label>}
      <div className="color-picker-body">
        <div className="color-picker-sv-wrap" style={{ position: 'relative' }}>
          <canvas
            ref={wheelRef}
            width={size}
            height={size}
            className="color-picker-sv"
            onMouseDown={onWheelDown}
            onTouchStart={onWheelDown}
          />
          {/* SV cursor */}
          <div
            className="color-picker-cursor"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`,
            }}
          />
        </div>
        <div className="color-picker-hue-wrap" style={{ position: 'relative' }}>
          <canvas
            ref={stripRef}
            width={20}
            height={size}
            className="color-picker-hue"
            onMouseDown={onStripDown}
            onTouchStart={onStripDown}
          />
          {/* Hue cursor */}
          <div
            className="color-picker-hue-cursor"
            style={{ top: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
        <div
          className="color-picker-preview"
          style={{ background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` }}
        >
          <span className="color-picker-hex">{hex}</span>
        </div>
      </div>
    </div>
  );
}

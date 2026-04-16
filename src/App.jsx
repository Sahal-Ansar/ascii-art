import React, { useState, useRef, useCallback, useEffect } from 'react';
import AsciiCanvas from './components/AsciiCanvas';
import ControlPanel from './components/ControlPanel';
import ModeSwitcher from './components/ModeSwitcher';
import { useCamera } from './hooks/useCamera';
import { useAsciiRenderer } from './hooks/useAsciiRenderer';
import { useResponsive } from './hooks/useResponsive';
import { CHAR_PRESETS } from './utils/ascii';
import { exportAsPng, exportAsJpg, exportAsTxt, exportAsHtml } from './utils/export';
import { getCharColor } from './utils/color';
import { getLuminance, applyAdjustments } from './utils/ascii';

function App() {
  const { isMobile, panelOpen, setPanelOpen, togglePanel, recommendedFontSize } = useResponsive();
  const camera = useCamera();

  // ── Settings State ──
  const [settings, setSettings] = useState({
    charPreset: 'complex',
    charset: CHAR_PRESETS.complex,
    colorMode: 'monochrome',
    monoColor: [0, 255, 136],
    gradientStops: [[0, 200, 255], [255, 0, 200]],
    brightness: 0,
    contrast: 0,
    fontSize: 10,
    invert: false,
    edgeDetect: false,
    performanceMode: 'balanced',
  });

  const [mode, setMode] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasComponentRef = useRef(null);

  // ── ASCII Renderer Hook ──
  const renderer = useAsciiRenderer({
    charset: settings.charset,
    colorMode: settings.colorMode,
    monoColor: settings.monoColor,
    gradientStops: settings.gradientStops,
    brightness: settings.brightness,
    contrast: settings.contrast,
    fontSize: settings.fontSize,
    invert: settings.invert,
    edgeDetect: settings.edgeDetect,
    performanceMode: settings.performanceMode,
  });

  // Set initial font size based on device
  useEffect(() => {
    setSettings(prev => ({ ...prev, fontSize: recommendedFontSize }));
  }, [recommendedFontSize]);

  // Splash screen
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  // ── MODE CHANGE ──
  const handleModeChange = useCallback((newMode) => {
    if (newMode === mode) return;

    // Stop camera if leaving camera mode
    if (mode === 'camera' && camera.isActive) {
      renderer.stopRenderLoop();
      camera.stopCamera();
    }

    setMode(newMode);
    setIsCaptured(false);
    setUploadedImage(null);
  }, [mode, camera, renderer]);

  // ── CAMERA ──
  const handleStartCamera = useCallback(async () => {
    await camera.startCamera();
    setIsCaptured(false);
  }, [camera]);

  // Start render loop when camera becomes active
  useEffect(() => {
    if (mode === 'camera' && camera.isActive && camera.videoRef.current && !isCaptured) {
      // Small delay to ensure video is ready
      const timer = setTimeout(() => {
        renderer.startRenderLoop(camera.videoRef.current);
      }, 300);
      return () => {
        clearTimeout(timer);
        renderer.stopRenderLoop();
      };
    }
  }, [mode, camera.isActive, isCaptured, renderer.startRenderLoop, renderer.stopRenderLoop, settings]);

  const handleCapture = useCallback(() => {
    renderer.stopRenderLoop();
    setIsCaptured(true);
  }, [renderer]);

  const handleResumeCamera = useCallback(() => {
    setIsCaptured(false);
    if (camera.videoRef.current && camera.isActive) {
      renderer.startRenderLoop(camera.videoRef.current);
    }
  }, [camera, renderer]);

  // ── UPLOAD ──
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setUploadedImage(URL.createObjectURL(file));
    };
    img.src = URL.createObjectURL(file);
  }, []);

  // Re-render uploaded image when settings change
  useEffect(() => {
    if (mode === 'upload' && imageRef.current && renderer.canvasRef.current) {
      // Delay slightly to allow canvas resize
      const timer = setTimeout(() => {
        renderer.renderImage(imageRef.current);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mode, uploadedImage, settings, renderer.renderImage]);

  // ── EXPORT ──
  const handleExport = useCallback((format) => {
    const canvas = renderer.canvasRef.current;
    const grid = renderer.lastGridRef.current;
    const bounds = renderer.renderBoundsRef.current;
    if (!canvas) return;

    const timestamp = Date.now();

    switch (format) {
      case 'png':
        exportAsPng(canvas, `ascii_capture_${timestamp}.png`, bounds);
        break;
      case 'jpg':
        exportAsJpg(canvas, `ascii_capture_${timestamp}.jpg`, bounds);
        break;
      case 'txt':
        if (grid) exportAsTxt(grid.chars, `ascii_capture_${timestamp}.txt`);
        break;
      case 'html':
        if (grid) {
          const colorStrings = grid.colors.map((row, ri) =>
            row.map((color, ci) => {
              const lum = getLuminance(color[0], color[1], color[2]);
              const adj = applyAdjustments(lum, settings.brightness, settings.contrast);
              return getCharColor(
                settings.colorMode, color, adj,
                settings.monoColor, settings.gradientStops
              );
            })
          );
          exportAsHtml(grid.chars, colorStrings, '#0a0a0f', settings.fontSize, `ascii_capture_${timestamp}.html`);
        }
        break;
    }
    setShowExportMenu(false);
  }, [renderer, settings]);

  // ── RENDER ──
  return (
    <div className="app" id="app">
      {/* ── Splash Screen ── */}
      {showSplash && (
        <div className={`splash ${!showSplash ? 'fade-out' : ''}`} id="splash-screen">
          <div className="splash-content">
            <div className="splash-icon">
              <span>{'>'}_</span>
            </div>
            <h1 className="splash-title">ASCII Studio</h1>
            <p className="splash-subtitle">Real-time ASCII Art Generator</p>
            <div className="splash-loader">
              <div className="loader-bar" />
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden Video Element for Camera ── */}
      <video
        ref={camera.videoRef}
        playsInline
        muted
        autoPlay
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
      />

      {/* ── Hidden File Input ── */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="file-input"
      />

      {/* ── Top Bar ── */}
      <header className="top-bar" id="top-bar">
        <div className="top-bar-left">
          <div className="logo" id="logo">
            <span className="logo-bracket">{'>'}</span>
            <span className="logo-cursor">_</span>
            <span className="logo-text">ASCII Studio</span>
          </div>
        </div>

        <div className="top-bar-center">
          <ModeSwitcher mode={mode} onModeChange={handleModeChange} />
        </div>

        <div className="top-bar-right">
          {/* Export Button */}
          <div className="export-wrap">
            <button
              className="action-btn export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              id="btn-export"
              aria-label="Export"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {!isMobile && <span>Export</span>}
            </button>

            {showExportMenu && (
              <div className="export-menu glass" id="export-menu">
                <div className="export-group-label">Image</div>
                <button onClick={() => handleExport('png')} id="export-png">
                  <span className="export-icon">🖼️</span>PNG <span className="export-hint">Lossless</span>
                </button>
                <button onClick={() => handleExport('jpg')} id="export-jpg">
                  <span className="export-icon">📷</span>JPG <span className="export-hint">Smaller file</span>
                </button>
                <div className="export-divider" />
                <div className="export-group-label">Text</div>
                <button onClick={() => handleExport('txt')} id="export-txt">
                  <span className="export-icon">📄</span>Plain Text
                </button>
                <button onClick={() => handleExport('html')} id="export-html">
                  <span className="export-icon">🌐</span>Colored HTML
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="main-content" id="main-content">
        {/* ASCII Canvas */}
        <AsciiCanvas
          ref={canvasComponentRef}
          canvasRef={renderer.canvasRef}
        />

        {/* Overlay for empty states */}
        {mode === 'camera' && !camera.isActive && (
          <div className="overlay-message" id="camera-prompt">
            <div className="overlay-card glass">
              <div className="overlay-icon camera-icon-big">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <h2>Enable Camera</h2>
              <p>Transform your camera feed into live ASCII art</p>
              <button className="primary-btn glow-btn" onClick={handleStartCamera} id="btn-enable-camera">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Start Camera
              </button>
              {camera.error && <p className="error-text">{camera.error}</p>}
            </div>
          </div>
        )}

        {mode === 'upload' && !uploadedImage && (
          <div className="overlay-message" id="upload-prompt">
            <div
              className="overlay-card glass upload-drop"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const img = new Image();
                  img.onload = () => {
                    imageRef.current = img;
                    setUploadedImage(URL.createObjectURL(file));
                  };
                  img.src = URL.createObjectURL(file);
                }
              }}
            >
              <div className="overlay-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
              </div>
              <h2>Upload Image</h2>
              <p>Click or drag & drop an image to convert to ASCII art</p>
              <button className="primary-btn glow-btn" id="btn-upload-image">
                Choose Image
              </button>
            </div>
          </div>
        )}

        {/* Camera controls overlay */}
        {mode === 'camera' && camera.isActive && (
          <div className="camera-controls" id="camera-controls">
            {/* Camera flip button */}
            <button className="cam-ctrl-btn flip-btn" onClick={camera.toggleFacing} id="btn-flip-camera" aria-label="Flip camera">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>

            {/* Capture / Resume */}
            {!isCaptured ? (
              <button className="cam-ctrl-btn capture-btn" onClick={handleCapture} id="btn-capture" aria-label="Capture">
                <div className="capture-ring">
                  <div className="capture-dot" />
                </div>
              </button>
            ) : (
              <button className="cam-ctrl-btn resume-btn" onClick={handleResumeCamera} id="btn-resume" aria-label="Resume camera">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
              </button>
            )}

            {/* Stop camera */}
            <button className="cam-ctrl-btn stop-btn" onClick={() => { renderer.stopRenderLoop(); camera.stopCamera(); setIsCaptured(false); }} id="btn-stop-camera" aria-label="Stop camera">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
            </button>
          </div>
        )}

        {/* Upload mode: change image button */}
        {mode === 'upload' && uploadedImage && (
          <div className="upload-actions" id="upload-actions">
            <button className="cam-ctrl-btn" onClick={() => fileInputRef.current?.click()} id="btn-change-image" aria-label="Change image">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* ── Control Panel ── */}
      <ControlPanel
        settings={settings}
        onSettingsChange={setSettings}
        isMobile={isMobile}
        panelOpen={panelOpen}
        onTogglePanel={togglePanel}
      />

      {/* Click-away for export menu */}
      {showExportMenu && (
        <div className="click-away" onClick={() => setShowExportMenu(false)} />
      )}
    </div>
  );
}

export default App;

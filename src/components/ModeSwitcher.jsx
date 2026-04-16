import React from 'react';

/**
 * Mode Switcher - toggles between Camera and Upload modes
 * Segmented control style, Apple-inspired
 */
export default function ModeSwitcher({ mode, onModeChange }) {
  return (
    <div className="mode-switcher" id="mode-switcher">
      <button
        id="mode-camera"
        className={`mode-btn ${mode === 'camera' ? 'active' : ''}`}
        onClick={() => onModeChange('camera')}
        aria-label="Camera mode"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>Camera</span>
      </button>
      <button
        id="mode-upload"
        className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}
        onClick={() => onModeChange('upload')}
        aria-label="Upload mode"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>Upload</span>
      </button>
    </div>
  );
}

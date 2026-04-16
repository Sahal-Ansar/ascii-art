import React, { useState } from 'react';
import ColorPicker from './ColorPicker';
import { CHAR_PRESETS } from '../utils/ascii';
import { hexToRgb, rgbToHex } from '../utils/color';

/* ── Inline SVG Tab Icons (outline style) ── */
const TabIcons = {
  characters: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  colors: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" />
      <circle cx="6.5" cy="12.5" r="2.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  resolution: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  performance: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

/**
 * Control Panel
 * Apple-style glassmorphism panel with outline icons
 */
export default function ControlPanel({
  settings,
  onSettingsChange,
  isMobile,
  panelOpen,
  onTogglePanel,
}) {
  const [activeSection, setActiveSection] = useState('characters');

  const update = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const sections = [
    { id: 'characters', label: 'Chars' },
    { id: 'colors', label: 'Color' },
    { id: 'resolution', label: 'Size' },
    { id: 'image', label: 'Image' },
    { id: 'performance', label: 'Perf' },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="panel-toggle"
          id="panel-toggle"
          onClick={onTogglePanel}
          aria-label="Toggle controls"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={panelOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
          </svg>
          <span>Controls</span>
        </button>
      )}

      <div className={`control-panel ${panelOpen || !isMobile ? 'open' : 'closed'}`} id="control-panel">
        {/* Section tabs */}
        <div className="panel-tabs" id="panel-tabs">
          {sections.map(sec => (
            <button
              key={sec.id}
              className={`panel-tab ${activeSection === sec.id ? 'active' : ''}`}
              onClick={() => setActiveSection(sec.id)}
              id={`tab-${sec.id}`}
            >
              <span className="tab-icon">{TabIcons[sec.id]}</span>
              <span className="tab-label">{sec.label}</span>
            </button>
          ))}
        </div>

        <div className="panel-content">
          {/* ── CHARACTERS ── */}
          {activeSection === 'characters' && (
            <div className="panel-section" id="section-characters">
              <h3 className="section-title">Character Set</h3>

              <div className="preset-grid">
                {Object.entries(CHAR_PRESETS).map(([key, val]) => (
                  <button
                    key={key}
                    className={`preset-btn ${settings.charPreset === key ? 'active' : ''}`}
                    onClick={() => {
                      update('charPreset', key);
                      update('charset', val);
                    }}
                    id={`preset-${key}`}
                  >
                    <span className="preset-name">{key}</span>
                    <span className="preset-preview">{val.slice(0, 8)}…</span>
                  </button>
                ))}
              </div>

              <label className="control-label">Custom Characters</label>
              <input
                type="text"
                className="text-input"
                value={settings.charset}
                onChange={(e) => {
                  update('charset', e.target.value);
                  update('charPreset', 'custom');
                }}
                placeholder="Enter characters (dark → light)"
                id="custom-charset"
              />

              <label className="control-label toggle-label">
                <span>Invert</span>
                <button
                  className={`toggle-switch ${settings.invert ? 'on' : ''}`}
                  onClick={() => update('invert', !settings.invert)}
                  id="toggle-invert"
                />
              </label>

              <label className="control-label toggle-label">
                <span>Edge Detection</span>
                <button
                  className={`toggle-switch ${settings.edgeDetect ? 'on' : ''}`}
                  onClick={() => update('edgeDetect', !settings.edgeDetect)}
                  id="toggle-edge"
                />
              </label>
            </div>
          )}

          {/* ── COLORS ── */}
          {activeSection === 'colors' && (
            <div className="panel-section" id="section-colors">
              <h3 className="section-title">Color Mode</h3>

              <div className="color-mode-pills">
                {['monochrome', 'fullcolor', 'gradient'].map(m => (
                  <button
                    key={m}
                    className={`pill-btn ${settings.colorMode === m ? 'active' : ''}`}
                    onClick={() => update('colorMode', m)}
                    id={`color-mode-${m}`}
                  >
                    {m === 'fullcolor' ? 'Full Color' : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>

              {settings.colorMode === 'monochrome' && (
                <ColorPicker
                  color={settings.monoColor}
                  onChange={(c) => update('monoColor', c)}
                  label="Text Color"
                />
              )}

              {settings.colorMode === 'gradient' && (
                <div className="gradient-controls">
                  {settings.gradientStops.map((stop, i) => (
                    <ColorPicker
                      key={i}
                      color={stop}
                      onChange={(c) => {
                        const stops = [...settings.gradientStops];
                        stops[i] = c;
                        update('gradientStops', stops);
                      }}
                      label={`Color ${i + 1}`}
                    />
                  ))}
                  {settings.gradientStops.length < 3 && (
                    <button
                      className="add-stop-btn"
                      onClick={() => update('gradientStops', [...settings.gradientStops, [255, 255, 255]])}
                      id="add-gradient-stop"
                    >
                      + Add Color
                    </button>
                  )}
                  {settings.gradientStops.length > 2 && (
                    <button
                      className="add-stop-btn remove"
                      onClick={() => update('gradientStops', settings.gradientStops.slice(0, -1))}
                      id="remove-gradient-stop"
                    >
                      − Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── RESOLUTION ── */}
          {activeSection === 'resolution' && (
            <div className="panel-section" id="section-resolution">
              <h3 className="section-title">Resolution & Size</h3>

              <label className="control-label">
                Font Size: <span className="value-badge">{settings.fontSize}px</span>
              </label>
              <input
                type="range"
                className="slider"
                min="3"
                max="20"
                step="1"
                value={settings.fontSize}
                onChange={(e) => update('fontSize', parseInt(e.target.value))}
                id="slider-font-size"
              />
              <div className="slider-labels">
                <span>More Detail</span>
                <span>Larger</span>
              </div>
            </div>
          )}

          {/* ── IMAGE CONTROLS ── */}
          {activeSection === 'image' && (
            <div className="panel-section" id="section-image">
              <h3 className="section-title">Image Adjustments</h3>

              <label className="control-label">
                Brightness: <span className="value-badge">{settings.brightness}</span>
              </label>
              <input
                type="range"
                className="slider"
                min="-50"
                max="50"
                step="1"
                value={settings.brightness}
                onChange={(e) => update('brightness', parseInt(e.target.value))}
                id="slider-brightness"
              />

              <label className="control-label">
                Contrast: <span className="value-badge">{settings.contrast}</span>
              </label>
              <input
                type="range"
                className="slider"
                min="-50"
                max="50"
                step="1"
                value={settings.contrast}
                onChange={(e) => update('contrast', parseInt(e.target.value))}
                id="slider-contrast"
              />
            </div>
          )}

          {/* ── PERFORMANCE ── */}
          {activeSection === 'performance' && (
            <div className="panel-section" id="section-performance">
              <h3 className="section-title">Performance</h3>

              <div className="perf-pills">
                {[
                  { key: 'high', label: 'High Quality', desc: '30 FPS' },
                  { key: 'balanced', label: 'Balanced', desc: '20 FPS' },
                  { key: 'performance', label: 'Performance', desc: '12 FPS' },
                ].map(p => (
                  <button
                    key={p.key}
                    className={`perf-btn ${settings.performanceMode === p.key ? 'active' : ''}`}
                    onClick={() => update('performanceMode', p.key)}
                    id={`perf-${p.key}`}
                  >
                    <span className="perf-label">{p.label}</span>
                    <span className="perf-desc">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

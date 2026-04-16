import React, { useState } from 'react';
import ColorPicker from './ColorPicker';
import { CHAR_PRESETS } from '../utils/ascii';
import { hexToRgb, rgbToHex } from '../utils/color';

/**
 * Control Panel
 * Glassmorphism floating panel with all ASCII art controls
 * Responsive: side panel on desktop, bottom sheet on mobile
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
    { id: 'characters', label: 'Chars', icon: 'Aa' },
    { id: 'colors', label: 'Color', icon: '🎨' },
    { id: 'resolution', label: 'Size', icon: '📐' },
    { id: 'image', label: 'Image', icon: '🔆' },
    { id: 'performance', label: 'Perf', icon: '⚡' },
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <span className="tab-icon">{sec.icon}</span>
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

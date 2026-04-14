import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { getBackgroundStyle, getDesignById } from './utils/backgroundDesigns';
import './components/ProjectionView.css';

const ProjectionPage = () => {
  const [data, setData] = useState(null);
  const [dataType, setDataType] = useState('announcement');
  const [isPaused, setIsPaused] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [textColor, setTextColor] = useState('#ffffff');
  const [showControls, setShowControls] = useState(false);

  // Listen for projection data from main process
  useEffect(() => {
    const handleProjectionData = (projectionData, type = 'announcement') => {
      console.log('[ProjectionPage] Received projection data:', type, projectionData);
      setData(projectionData);
      setDataType(type);
    };

    const handleProjectionUpdate = (updateData) => {
      console.log('[ProjectionPage] Received projection update:', updateData);
      setData(updateData);
    };

    if (window.api && window.api.onProjectionData) {
      window.api.onProjectionData(handleProjectionData);
      window.api.onProjectionDataUpdate(handleProjectionUpdate);
    }

    return () => {
      if (window.api && window.api.removeProjectionDataListener) {
        window.api.removeProjectionDataListener();
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        if (showControls) {
          setShowControls(false);
        } else {
          if (window.api) {
            window.api.closeProjection();
          }
        }
      } else if (event.key === ' ') {
        event.preventDefault();
        setIsPaused(!isPaused);
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setFontSizeMultiplier(prev => Math.min(prev + 0.1, 2));
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        setFontSizeMultiplier(prev => Math.max(prev - 0.1, 0.7));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showControls, isPaused]);

  if (!data) {
    return (
      <div className="projection-overlay" style={{ background: '#000' }}>
        <div className="projection-display" style={{ background: '#000' }}>
          <div className="projection-content">
            <p style={{ color: '#fff', fontSize: '2rem' }}>Waiting for content...</p>
            <p style={{ color: '#888', fontSize: '1rem', marginTop: '1rem' }}>Connected to secondary display</p>
          </div>
        </div>
      </div>
    );
  }

  const design = getDesignById(data.backgroundDesignId) || {};
  const backgroundStyle = getBackgroundStyle(design);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="projection-overlay">
      <div
        className="projection-display"
        style={backgroundStyle}
      >
        {/* Semi-transparent overlay for better text readability */}
        <div className="projection-overlay-layer"></div>

        {/* Main content */}
        <div 
          className="projection-content"
          onClick={() => setShowControls(!showControls)}
        >
          {/* Header with priority badge - for announcements only */}
          {dataType === 'announcement' && (
            <div className="projection-header">
              {data.priority && (
                <span className={`projection-priority-badge priority-${data.priority}`}>
                  {data.priority.charAt(0).toUpperCase() + data.priority.slice(1)} Priority
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h1 
            className="projection-title" 
            style={{ 
              color: textColor,
              fontSize: `${4 * fontSizeMultiplier}rem`
            }}
          >
            {data.title || data.name || 'Untitled'}
          </h1>

          {/* Content based on type */}
          <div className="projection-body">
            {dataType === 'verse' ? (
              // Scripture verse display
              <div>
                <p 
                  className="projection-content-text" 
                  style={{ 
                    color: textColor,
                    fontSize: `${2.5 * fontSizeMultiplier}rem`,
                    lineHeight: '1.8'
                  }}
                >
                  {data.text || data.content}
                </p>
                <p 
                  className="projection-metadata" 
                  style={{ color: textColor, fontSize: `${1.25 * fontSizeMultiplier}rem`, marginTop: '1rem' }}
                >
                  {data.reference || 'Scripture'}
                </p>
              </div>
            ) : dataType === 'hymn' ? (
              // Hymn display
              <div>
                <p 
                  className="projection-content-text" 
                  style={{ 
                    color: textColor,
                    fontSize: `${1.875 * fontSizeMultiplier}rem`,
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.8'
                  }}
                >
                  {data.lyrics || data.content}
                </p>
              </div>
            ) : (
              // Default announcement display
              <p 
                className="projection-content-text" 
                style={{ 
                  color: textColor,
                  fontSize: `${1.875 * fontSizeMultiplier}rem`
                }}
              >
                {data.content}
              </p>
            )}
            
            {/* Metadata for announcements */}
            {dataType === 'announcement' && !isPaused && data.date && (
              <p 
                className="projection-metadata" 
                style={{ color: textColor }}
              >
                {formatDate(data.date)} • {formatTime(data.date)}
              </p>
            )}
          </div>

          {/* Control Panel - visible on click */}
          {showControls && (
            <div className="projection-controls">
              <div className="controls-group">
                <label>Text Size:</label>
                <div className="control-buttons">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFontSizeMultiplier(prev => Math.max(prev - 0.1, 0.7));
                    }}
                    className="control-btn"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="control-value">{(fontSizeMultiplier * 100).toFixed(0)}%</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFontSizeMultiplier(prev => Math.min(prev + 0.1, 2));
                    }}
                    className="control-btn"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="controls-group">
                <label>Text Color:</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="color-picker"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="controls-group">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused(!isPaused);
                  }}
                  className={`control-btn ${isPaused ? 'paused' : ''}`}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>

              <div className="controls-info">
                <p>ESC - Close | SPACE - Pause/Resume | +/- - Font Size</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectionPage;

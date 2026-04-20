import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Minimize, Book } from "lucide-react";

const ScriptureProjectionWindow = () => {
  const [projectionData, setProjectionData] = useState(null);
  const [showProjectionUI, setShowProjectionUI] = useState(true);
  const hideTimeoutRef = React.useRef(null);

  // Handle showing UI and setting auto-hide timer
  const handleProjectionActivity = useCallback(() => {
    setShowProjectionUI(true);
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      setShowProjectionUI(false);
    }, 4000);
  }, []);

  // Listen for projection data from main process
  useEffect(() => {
    const handleProjectionData = (data, type) => {
      if (type === 'scripture') {
        setProjectionData(data);
      }
    };

    const handleProjectionUpdate = (data) => {
      setProjectionData(data);
    };

    if (window.api) {
      window.api.onProjectionData(handleProjectionData);
      window.api.onProjectionDataUpdate(handleProjectionUpdate);
    }

    return () => {
      if (window.api && window.api.removeProjectionDataListener) {
        window.api.removeProjectionDataListener();
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Handle keyboard and mouse activity
  useEffect(() => {
    const handleKeyDown = (e) => {
      handleProjectionActivity();
      
      if (e.key === 'ArrowRight' && projectionData) {
        window.api?.send('projection-navigate', 'next');
      } else if (e.key === 'ArrowLeft' && projectionData) {
        window.api?.send('projection-navigate', 'previous');
      } else if (e.key === 'Escape') {
        window.api?.closeProjection();
      }
    };

    const handleMouseMove = () => {
      handleProjectionActivity();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleProjectionActivity, projectionData]);

  const handlePreviousVerse = () => {
    window.api?.send('projection-navigate', 'previous');
  };

  const handleNextVerse = () => {
    window.api?.send('projection-navigate', 'next');
  };

  const handleClose = () => {
    window.api?.closeProjection();
  };

  const handleLanguageChange = (language) => {
    window.api?.send('projection-language-change', language);
  };

  if (!projectionData) {
    return (
      <div className="projection-overlay">
        <style>{projectionStyles}</style>
        <div className="projection-content" style={{ justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Book size={64} style={{ color: '#4caf50', marginBottom: '1rem' }} />
            <p style={{ fontSize: '2rem', color: '#fff' }}>Waiting for scripture...</p>
            <p style={{ fontSize: '1rem', color: '#888', marginTop: '1rem' }}>Connected to secondary display</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    currentVerse,
    showBothLanguages,
    projectionLanguage,
    fontSize,
    englishVerse,
    twiVerse,
    currentVerseIndex,
    totalVerses
  } = projectionData;

  return (
    <div className={`projection-overlay ${!showProjectionUI ? 'hide-ui' : ''}`}>
      <style>{projectionStyles}</style>
      
      {/* Header with Exit Button */}
      <div className="projection-header">
        <div className="projection-title">
          <Book size={24} />
          <span>{currentVerse?.reference || 'Scripture'}</span>
        </div>
        <div className="projection-language-toggle" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', margin: 0, padding: 0, flex: 1 }}>
          <button
            className={`language-btn${projectionLanguage === 'nkjv' && !showBothLanguages ? ' active' : ''}`}
            onClick={() => handleLanguageChange('nkjv')}
          >
            English (NKJV)
          </button>
          <button
            className={`language-btn${projectionLanguage === 'twi' && !showBothLanguages ? ' active' : ''}`}
            onClick={() => handleLanguageChange('twi')}
          >
            Twi Asem
          </button>
          <button
            className={`language-btn${showBothLanguages ? ' active' : ''}`}
            onClick={() => handleLanguageChange('both')}
          >
            Both
          </button>
        </div>
        <button 
          className="projection-exit"
          onClick={handleClose}
          title="Exit Projection Mode"
          style={{ minWidth: 'fit-content' }}
        >
          <Minimize size={20} />
          <span>Exit</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="projection-content">
        <div className="projection-verse-container">
          {showBothLanguages ? (
            <div className="projection-both-languages">
              <div className="projection-language-column">
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  English (NKJV)
                </div>
                <div 
                  className="projection-verse-text"
                  style={{ fontSize: `${fontSize}px`, color: '#ffffff' }}
                >
                  {englishVerse}
                </div>
              </div>
              <div className="projection-language-column">
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Twi Asem
                </div>
                <div 
                  className="projection-verse-text"
                  style={{ fontSize: `${fontSize}px`, color: '#10b981' }}
                >
                  {twiVerse}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div 
                className="projection-verse-text"
                style={{ fontSize: `${fontSize}px`, color: projectionLanguage === 'twi' ? '#10b981' : '#ffffff' }}
              >
                {projectionLanguage === 'twi' ? twiVerse : englishVerse}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={handlePreviousVerse}
        disabled={currentVerseIndex === 0}
        className="projection-nav-btn projection-prev"
        title="Previous Verse"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={handleNextVerse}
        disabled={currentVerseIndex >= totalVerses - 1}
        className="projection-nav-btn projection-next"
        title="Next Verse"
      >
        <ChevronRight size={24} />
      </button>

      {/* Footer */}
      <div className="projection-footer">
        <button 
          onClick={handlePreviousVerse}
          disabled={currentVerseIndex === 0}
          className="projection-footer-btn"
        >
          <ChevronLeft size={16} />
          Previous Verse
        </button>
        <div className="projection-verse-counter">
          Verse {currentVerseIndex + 1} of {totalVerses}
        </div>
        <button 
          onClick={handleNextVerse}
          disabled={currentVerseIndex >= totalVerses - 1}
          className="projection-footer-btn"
        >
          Next Verse
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const projectionStyles = `
  .projection-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    color: white;
  }

  .projection-header {
    background: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.4rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    gap: 1rem;
    transition: opacity 0.3s ease, transform 0.3s ease;
    height: auto;
  }

  .projection-overlay.hide-ui .projection-header {
    opacity: 0;
    transform: translateY(-100%);
    pointer-events: none;
  }

  .projection-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.2rem;
    font-weight: 700;
    color: #4caf50;
    min-width: fit-content;
  }

  .projection-exit {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(239, 68, 68, 0.9);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
    flex-shrink: 0;
    margin: -2rem 2rem 0 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .projection-exit:hover {
    background: rgba(239, 68, 68, 1);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.6);
  }

  .projection-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 80px 180px 160px 180px;
    overflow-y: auto;
    min-height: 0;
    transition: padding 0.3s ease;
    flex-direction: column;
  }

  .projection-overlay.hide-ui .projection-content {
    padding: 0 180px;
  }

  .projection-verse-container {
    width: 100%;
    max-width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: fit-content;
  }

  .projection-both-languages {
    display: flex;
    gap: 4rem;
    justify-content: center;
    width: 100%;
    align-items: center;
  }

  .projection-language-column {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }

  @media (max-width: 1400px) {
    .projection-content {
      padding: 2rem 120px;
    }

    .projection-both-languages {
      gap: 3rem;
    }
  }

  @media (max-width: 1024px) {
    .projection-content {
      padding: 2rem 80px;
    }

    .projection-both-languages {
      gap: 2rem;
    }
  }

  @media (max-width: 768px) {
    .projection-content {
      padding: 2rem 1.5rem;
    }

    .projection-both-languages {
      flex-direction: column;
      gap: 2rem;
    }

    .projection-language-column {
      width: 100%;
    }

    .projection-verse-text {
      font-size: 32px !important;
      line-height: 1.6;
    }
  }

  @media (max-width: 480px) {
    .projection-content {
      padding: 1.5rem 1rem;
    }

    .projection-both-languages {
      gap: 1.5rem;
    }

    .projection-verse-text {
      font-size: 24px !important;
      line-height: 1.5;
    }
  }

  .projection-verse-text {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 48px;
    line-height: 1.8;
    color: white;
    font-weight: 300;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.5px;
    margin-bottom: 0;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
  }

  .projection-verse-reference {
    font-size: 2rem;
    color: #4caf50;
    font-style: italic;
    font-weight: 500;
    text-shadow: 0 3px 8px rgba(0, 0, 0, 0.6);
    margin-top: 2rem;
  }

  .projection-nav-btn {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4caf50 0%, rgb(62, 232, 15) 100%);
    color: #14213d;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 20px rgba(44, 252, 17, 0.4);
    transition: all 0.3s ease;
    z-index: 2001;
  }

  .projection-nav-btn:hover:not(:disabled) {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 8px 25px rgba(44, 252, 17, 0.6);
  }

  .projection-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.2);
  }

  .projection-prev {
    left: 40px;
  }

  .projection-next {
    right: 40px;
  }

  .projection-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    z-index: 2001;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .projection-overlay.hide-ui .projection-footer {
    opacity: 0;
    transform: translateY(100%);
    pointer-events: none;
  }

  .projection-footer-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    color: #4caf50;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .projection-footer-btn:hover:not(:disabled) {
    background: rgba(76, 175, 80, 0.3);
    border-color: rgba(76, 175, 80, 0.5);
  }

  .projection-footer-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .projection-verse-counter {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
    flex: 1;
    text-align: center;
  }

  .projection-language-toggle {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex: 1;
  }

  .language-btn {
    padding: 0.5rem 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: -1.5rem;
  }

  .language-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    color: #ffffff;
    transform: translateY(-2px);
  }

  .language-btn.active {
    background: #4caf50;
    color: #14213d;
    border-color: #4caf50;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }

  .language-btn.active:hover {
    background: #45a049;
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
  }
`;

export default ScriptureProjectionWindow;

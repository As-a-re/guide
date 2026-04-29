import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Type, Book, Hash, Monitor } from "lucide-react";
import { useProjection } from "./hooks/useProjection";
import { getBackgroundStyle, getDesignById } from "./utils/backgroundDesigns";

const ScriptureProjection = () => {
  // State hooks - must be called unconditionally at the top level
  const [bibleData, setBibleData] = useState({ nkjv: null, twi: null });
  const [isLoading, setIsLoading] = useState(true);
  const [activeBible, setActiveBible] = useState("nkjv");
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [verses, setVerses] = useState([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [fontSize, setFontSize] = useState(24); // Smaller default for projection
  const [isProjectionMode, setIsProjectionMode] = useState(false);
  const [showBothLanguages, setShowBothLanguages] = useState(false);
  const [projectionLanguage, setProjectionLanguage] = useState('nkjv'); // Track projection overlay language separately
  const [showProjectionUI, setShowProjectionUI] = useState(true); // Auto-hide UI in projection mode
  const [isExternalProjection, setIsExternalProjection] = useState(false); // Track external window projection
  const [backgroundDesignId, setBackgroundDesignId] = useState('design-1'); // Background design for projection
  const hideTimeoutRef = React.useRef(null);

  // Projection hook
  const { openProjection, updateProjection, closeProjection, hasSecondaryDisplay } = useProjection();

  // Derived state
  const currentBible = bibleData[activeBible];
  const currentBook = currentBible?.books?.find(b => b.name === selectedBook);
  const currentVerse = verses[currentVerseIndex] || { text: '', reference: '', verse: null };

  useEffect(() => {
    const loadBibleData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching Bible data...');
        const [nkjvResponse, twiResponse] = await Promise.all([
          fetch(process.env.PUBLIC_URL + "/newkjv.json"),
          fetch(process.env.PUBLIC_URL + "/twiBible.json")
        ]);

        if (!nkjvResponse.ok) throw new Error(`Failed to fetch NKJV data: ${nkjvResponse.status}`);
        if (!twiResponse.ok) throw new Error(`Failed to fetch Twi data: ${twiResponse.status}`);

        const nkjvData = await nkjvResponse.json();
        const twiData = await twiResponse.json();
        
        console.log('Loaded NKJV data:', nkjvData?.books?.length ? `${nkjvData.books.length} books` : 'No books found');
        console.log('Loaded Twi data:', twiData?.books?.length ? `${twiData.books.length} books` : 'No books found');

        setBibleData({
          nkjv: nkjvData,
          twi: twiData
        });

        if (nkjvData.books?.length > 0) {
          setSelectedBook(nkjvData.books[0].name);
          if (nkjvData.books[0].chapters?.length > 0) {
            setSelectedChapter(nkjvData.books[0].chapters[0].chapter);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading Bible data:", error);
        setIsLoading(false);
      }
    };

    loadBibleData();
  }, []);

  // Clean up Twi text (remove extra spaces and fix punctuation)
  const cleanTwiText = (text) => {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+([.,;:!?])/g, '$1') // Remove space before punctuation
      .replace(/([.,;:!?])\s*([.,;:!?])/g, '$1$2') // Fix double punctuation
      .replace(/\.\s+\./g, '.') // Fix multiple periods
      .trim();
  };

  useEffect(() => {
  if (!currentBible || !currentBible.books || !selectedBook || selectedChapter === null) {
    return;
  }

  const book = currentBible.books.find(b => b.name === selectedBook);
  if (!book) return;

  const chapter = book.chapters.find(c => c.chapter === selectedChapter);
  if (!chapter) return;

  const versesList = chapter.verses.map(verse => ({
    id: `${selectedBook}-${selectedChapter}-${verse.verse}`,
    reference: `${selectedBook} ${selectedChapter}:${verse.verse}`,
    text: activeBible === 'twi' ? cleanTwiText(verse.text) : verse.text,
    verse: verse.verse
  }));

  setVerses(versesList);
  // Only reset to 0 if current index is out of bounds for the new verses list
  if (currentVerseIndex >= versesList.length && versesList.length > 0) {
    setCurrentVerseIndex(Math.max(0, versesList.length - 1));
  }
}, [activeBible, selectedBook, selectedChapter, bibleData, currentBible, currentVerseIndex]);

  const handleNextVerse = useCallback(() => {
    setCurrentVerseIndex(prev => Math.min(prev + 1, verses.length - 1));
  }, [verses.length]);

  const handlePreviousVerse = useCallback(() => {
    setCurrentVerseIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleBookSelect = useCallback((bookName) => {
    setSelectedBook(bookName);
    const book = bibleData[activeBible]?.books.find(b => b.name === bookName);
    if (book?.chapters?.length > 0) {
      setSelectedChapter(book.chapters[0].chapter);
    }
    setCurrentVerseIndex(0);
  }, [activeBible, bibleData]);

  const handleChapterSelect = useCallback((chapterNum) => {
    setSelectedChapter(chapterNum);
    setCurrentVerseIndex(0);
  }, []);

  const handleVerseSelect = useCallback((verseIndex) => {
    setCurrentVerseIndex(Number(verseIndex));
  }, []);

  const handleBibleSwitch = useCallback((newBible) => {
    if (newBible === activeBible) return; // No change needed

    const currentVerseNumber = verses[currentVerseIndex]?.verse;
    const prevBook = selectedBook;
    const prevChapter = selectedChapter;

    const newBibleData = bibleData[newBible];
    if (!newBibleData?.books?.length) {
      setActiveBible(newBible);
      return;
    }

    const bookExists = newBibleData.books.find(b => b.name === prevBook);

    if (bookExists) {
      setSelectedBook(prevBook);
      const chapterExists = bookExists.chapters?.find(c => c.chapter === prevChapter);
      if (chapterExists) {
        setSelectedChapter(prevChapter);
        // Try to find the same verse number in the new Bible
        const verseIndex = chapterExists.verses?.findIndex(
          v => v.verse === currentVerseNumber
        );
        // If the same verse exists, keep the same index; otherwise keep the previous index
        if (verseIndex !== -1) {
          setCurrentVerseIndex(verseIndex);
        }
        // If verse not found, leave currentVerseIndex as is - the effect will handle it
      } else if (bookExists.chapters?.length > 0) {
        // Chapter doesn't exist, go to first chapter but keep verse index
        setSelectedChapter(bookExists.chapters[0].chapter);
        // Don't reset verse index - let effect handle boundary checking
      }
    } else {
      // If book doesn't exist, reset to first available
      setSelectedBook(newBibleData.books[0].name);
      if (newBibleData.books[0].chapters?.length > 0) {
        setSelectedChapter(newBibleData.books[0].chapters[0].chapter);
      }
      setCurrentVerseIndex(0);
    }
    
    // Change activeBible LAST so effect runs with updated state
    setActiveBible(newBible);
  }, [selectedBook, selectedChapter, verses, currentVerseIndex, bibleData, activeBible]);

  const toggleProjectionMode = useCallback(() => {
    const newProjectionMode = !isProjectionMode;
    setIsProjectionMode(newProjectionMode);
    
    // When entering projection mode, sync projectionLanguage with current activeBible
    if (newProjectionMode) {
      setProjectionLanguage(activeBible);
      setShowBothLanguages(false);
      setShowProjectionUI(true);
    }
  }, [isProjectionMode, activeBible]);

  // Handle showing UI and setting auto-hide timer
  const handleProjectionActivity = useCallback(() => {
    setShowProjectionUI(true);
    
    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Set new timeout to hide UI after 4 seconds of inactivity
    hideTimeoutRef.current = setTimeout(() => {
      setShowProjectionUI(false);
    }, 4000);
  }, []);

  // Handle keyboard navigation and activity detection in projection mode
  useEffect(() => {
    if (isLoading) return;
    
    const handleKeyDown = (e) => {
      if (isProjectionMode) {
        handleProjectionActivity();
      }
      
      if (e.key === 'ArrowRight' && currentVerseIndex < verses.length - 1) {
        handleNextVerse();
      } else if (e.key === 'ArrowLeft' && currentVerseIndex > 0) {
        handlePreviousVerse();
      } else if (e.key === 'Escape' && isProjectionMode) {
        toggleProjectionMode();
      }
    };

    const handleMouseMove = () => {
      if (isProjectionMode) {
        handleProjectionActivity();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [currentVerseIndex, verses.length, isProjectionMode, handleNextVerse, handlePreviousVerse, toggleProjectionMode, isLoading, handleProjectionActivity]);

  // Listen for navigation commands from external projection window
  useEffect(() => {
    if (!window.api) return;

    const handleNavigate = (direction) => {
      if (direction === 'next') {
        handleNextVerse();
      } else if (direction === 'previous') {
        handlePreviousVerse();
      }
    };

    const handleLanguageChange = (language) => {
      if (language === 'both') {
        setShowBothLanguages(true);
      } else {
        setShowBothLanguages(false);
        setProjectionLanguage(language);
      }
    };

    window.api.onScriptureNavigate(handleNavigate);
    window.api.onScriptureLanguageChange(handleLanguageChange);

    return () => {
      if (window.api.removeScriptureListeners) {
        window.api.removeScriptureListeners();
      }
    };
  }, [handleNextVerse, handlePreviousVerse]);

  // Update external projection window whenever verse or settings change
  useEffect(() => {
    if (!isExternalProjection || !currentVerse?.verse) return;

    const projectionData = {
      currentVerse,
      showBothLanguages,
      projectionLanguage,
      fontSize,
      englishVerse: getEnglishVerse(),
      twiVerse: getTwiVerse(),
      currentVerseIndex,
      totalVerses: verses.length,
      backgroundDesignId,
      backgroundMode: 'design',
      reference: currentVerse.reference,
      book: selectedBook,
      chapter: selectedChapter
    };

    updateProjection(projectionData);
  }, [isExternalProjection, currentVerse, showBothLanguages, projectionLanguage, fontSize, currentVerseIndex, verses.length, backgroundDesignId, selectedBook, selectedChapter]);

  // Helper function to normalize book names (handles Roman numerals)
  const normalizeBookName = (name) => {
    if (!name) return "";

    return name
      .replace(/^I\s/, "1 ")
      .replace(/^II\s/, "2 ")
      .replace(/^III\s/, "3 ")
      .toLowerCase()
      .trim();
  };

  // Helper functions to fetch verses from correct Bible datasets
  const getEnglishVerse = () => {
    if (!currentVerse?.verse) return "";

    const chapter = bibleData.nkjv?.books
      ?.find(b => normalizeBookName(b.name) === normalizeBookName(selectedBook))
      ?.chapters?.find(c => c.chapter === selectedChapter);

    const verse = chapter?.verses?.find(
      v => v.verse === currentVerse.verse
    );

    return verse?.text || "English translation not found.";
  };

  const getTwiVerse = () => {
    if (!currentVerse?.verse) return "";

    const chapter = bibleData.twi?.books
      ?.find(b => normalizeBookName(b.name) === normalizeBookName(selectedBook))
      ?.chapters?.find(c => c.chapter === selectedChapter);

    const verse = chapter?.verses?.find(
      v => v.verse === currentVerse.verse
    );

    return verse ? cleanTwiText(verse.text) : "Twi translation not found.";
  };

  if (isLoading) {
    return (
      <div className="scripture-container loading">
        <style>{styles}</style>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading Scripture...</h2>
          <p>Please wait while we prepare the Word</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="scripture-container">
        <style>{styles}{projectionStyles}</style>
        
        <div className="header">
          <h1 className="app-title">
            <Book className="title-icon" />
            Scripture Projection
          </h1>
          <div className="bible-switcher">
            <button 
              className={`bible-tab ${activeBible === 'nkjv' ? 'active' : ''}`}
              onClick={() => handleBibleSwitch('nkjv')}
            >
              English (NKJV)
            </button>
            <button 
              className={`bible-tab ${activeBible === 'twi' ? 'active' : ''}`}
              onClick={() => handleBibleSwitch('twi')}
            >
              Twi Asem
            </button>
          </div>
        </div>

        <div className="controls-grid">
          <div className="control-group">
            <label>
              <Book size={16} />
              Book
            </label>
            <select 
              value={selectedBook || ''}
              onChange={(e) => handleBookSelect(e.target.value)}
              className="control-select"
            >
              {bibleData[activeBible]?.books?.map(book => (
                <option key={book.name} value={book.name}>
                  {book.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>
              <Hash size={16} />
              Chapter
            </label>
            <select 
              value={selectedChapter || ''}
              onChange={(e) => handleChapterSelect(e.target.value)}
              disabled={!selectedBook}
              className="control-select"
            >
              {currentBook?.chapters?.map(chapter => (
                <option key={chapter.chapter} value={chapter.chapter}>
                  Chapter {chapter.chapter}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>
              <Hash size={16} />
              Verse
            </label>
            <select 
              value={currentVerseIndex}
              onChange={(e) => handleVerseSelect(e.target.value)}
              disabled={!selectedBook || verses.length === 0}
              className="control-select"
            >
              {verses.map((verse, index) => (
                <option key={verse.id} value={index}>
                  Verse {verse.verse}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>
              <Type size={16} />
              Font Size
            </label>
            <select 
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="control-select"
            >
              <option value="24">Small (24px)</option>
              <option value="32">Medium (32px)</option>
              <option value="48">Large (48px)</option>
              <option value="64">X-Large (64px)</option>
            </select>
          </div>
        </div>

        <div className="verse-display">
          {currentVerse.text ? (
            <div className="verse-content">
              <div 
                className="verse-text" 
                style={{ fontSize: `${fontSize}px` }}
              >
                {currentVerse.text}
              </div>
              <div className="verse-reference">
                {currentVerse.reference}
              </div>
              <div className="verse-counter">
                Verse {currentVerseIndex + 1} of {verses.length}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Book size={48} />
              <h3>Select a Scripture</h3>
              <p>Choose a book and chapter to begin reading</p>
            </div>
          )}
        </div>

        <div className="navigation-section">
          <div className="nav-buttons">
            <button 
              onClick={handlePreviousVerse}
              disabled={currentVerseIndex === 0}
              className="nav-button prev"
            >
              <ChevronLeft size={20} /> 
              <span>Previous</span>
            </button>
            
            <div className="font-controls">
              <button 
                onClick={() => setFontSize(prev => Math.max(16, prev - 8))}
                className="font-btn"
                title="Decrease font size"
              >
                A-
              </button>
              <span className="font-size-display">{fontSize}px</span>
              <button 
                onClick={() => setFontSize(prev => Math.min(96, prev + 8))}
                className="font-btn"
                title="Increase font size"
              >
                A+
              </button>
            </div>
            
            <button 
              onClick={handleNextVerse}
              disabled={currentVerseIndex >= verses.length - 1}
              className="nav-button next"
            >
              <span>Next</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <button 
          className="projection-toggle"
          onClick={toggleProjectionMode}
          disabled={!currentVerse.text}
          title="Enter Projection Mode"
        >
          <Maximize size={20} />
          <span className="toggle-text">Present</span>
        </button>

        <button 
          className="projection-toggle"
          onClick={() => {
            if (isExternalProjection) {
              // Stop projection
              closeProjection();
              setIsExternalProjection(false);
              return;
            }
            
            if (!hasSecondaryDisplay) {
              alert('No secondary display detected. Connect a display: Win+P > Extend');
              return;
            }
            if (currentVerse.text) {
              // Open external projection window with scripture data
              const projectionData = {
                currentVerse,
                showBothLanguages,
                projectionLanguage,
                fontSize,
                englishVerse: getEnglishVerse(),
                twiVerse: getTwiVerse(),
                currentVerseIndex,
                totalVerses: verses.length,
                backgroundDesignId,
                backgroundMode: 'design',
                reference: currentVerse.reference,
                book: selectedBook,
                chapter: selectedChapter
              };
              openProjection(projectionData, 'scripture');
              setIsExternalProjection(true);
            }
          }}
          disabled={!currentVerse.text && !isExternalProjection}
          title={isExternalProjection ? "Stop projection" : (hasSecondaryDisplay ? "Project to extended display" : "No secondary display")}
          style={{ background: isExternalProjection ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', borderColor: isExternalProjection ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)', color: isExternalProjection ? '#ef4444' : '#3b82f6' }}
        >
          <Monitor size={20} />
          <span className="toggle-text">{isExternalProjection ? 'Stop' : 'Extend'}</span>
        </button>
      </div>

      {/* Projection Overlay - Similar to Hymns */}
      {isProjectionMode && currentVerse.text && (
        <div className={`projection-overlay ${!showProjectionUI ? 'hide-ui' : ''}`}>
          <style>{projectionStyles}</style>
          
          {/* Header with Exit Button */}
          <div className="projection-header">
            <div className="projection-title">
              <Book size={24} />
              <span>{currentVerse.reference}</span>
            </div>
            <div className="projection-language-toggle" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', margin: 0, padding: 0, flex: 1 }}>
              <button
                className={`language-btn${projectionLanguage === 'nkjv' && !showBothLanguages ? ' active' : ''}`}
                onClick={() => { setProjectionLanguage('nkjv'); setShowBothLanguages(false); }}
              >
                English (NKJV)
              </button>
              <button
                className={`language-btn${projectionLanguage === 'twi' && !showBothLanguages ? ' active' : ''}`}
                onClick={() => { setProjectionLanguage('twi'); setShowBothLanguages(false); }}
              >
                Twi Asem
              </button>
              <button
                className={`language-btn${showBothLanguages ? ' active' : ''}`}
                onClick={() => setShowBothLanguages(!showBothLanguages)}
              >
                Both
              </button>
            </div>
            <button 
              className="projection-exit"
              onClick={toggleProjectionMode}
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
                      {getEnglishVerse()}
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
                      {getTwiVerse()}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div 
                    className="projection-verse-text"
                    style={{ fontSize: `${fontSize}px`, color: projectionLanguage === 'twi' ? '#10b981' : '#ffffff' }}
                  >
                    {projectionLanguage === 'twi' ? getTwiVerse() : getEnglishVerse()}
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
            disabled={currentVerseIndex >= verses.length - 1}
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
            <button 
              onClick={handleNextVerse}
              disabled={currentVerseIndex >= verses.length - 1}
              className="projection-footer-btn"
            >
              Next Verse
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #14213d;
    color: #ffffff;
    min-height: 100vh;
  }
  
  .scripture-container {
    min-height: 100vh;
    background: linear-gradient(135deg, rgb(19, 26, 45) 0%, rgb(30, 41, 63) 50%, rgb(45, 55, 72) 100%);
    padding: 20px;
    transition: all 0.4s ease;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    color: #ffffff;
    padding: 2rem;
  }

  .loading-spinner {
    width: 80px;
    height: 80px;
    border: 4px solid rgba(76, 175, 80, 0.2);
    border-top: 4px solid #4caf50;
    border-right: 4px solid #4caf50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 30px;
    box-shadow: 0 0 30px rgba(76, 175, 80, 0.3);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-content h2 {
    font-size: 32px;
    margin-bottom: 15px;
    color: #4caf50;
    font-weight: 600;
    text-shadow: 0 2px 10px rgba(76, 175, 80, 0.4);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .loading-content p {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 400;
    letter-spacing: 0.5px;
    animation: fadeInOut 2s ease-in-out infinite;
  }

  @keyframes fadeInOut {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  .scripture-container.projection-mode {
    padding: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(45deg, #000 0%, #1a1a2e 50%, #16213e 100%);
    position: relative;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid rgba(68, 252, 17, 0.3);
  }

  .app-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 28px;
    font-weight: 600;
    color: #4caf50;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .title-icon {
    color: #4caf50;
  }

  .bible-switcher {
    display: flex;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 4px;
    backdrop-filter: blur(10px);
  }

  .bible-tab {
    padding: 12px 24px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .bible-tab.active {
    background: #4caf50;
    color: #14213d;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(52, 252, 17, 0.4);
  }

  .bible-tab:hover:not(.active) {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  .controls-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 30px;
  }

  @media (max-width: 1024px) {
    .controls-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #4caf50;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .control-select {
    padding: 14px 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .control-select:hover {
    border-color: rgba(17, 252, 33, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }

  .control-select:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 3px rgba(17, 252, 48, 0.2);
  }

  .control-select option {
    background: #14213d;
    color: #ffffff;
  }
  
  .verse-display {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    padding: 40px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin: 30px 0;
    min-height: 350px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .scripture-container.projection-mode .verse-display {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(30px);
    border: 2px solid rgba(17, 252, 60, 0.3);
    width: 90%;
    max-width: 1200px;
    height: 70vh;
    border-radius: 24px;
    box-shadow: 
      0 0 60px rgba(17, 252, 83, 0.2),
      inset 0 2px 0 rgba(255, 255, 255, 0.1);
  }

  .verse-content {
    text-align: center;
    max-width: 100%;
    width: 100%;
  }

  .verse-text {
    font-size: 32px;
    line-height: 1.7;
    margin-bottom: 30px;
    color: #ffffff;
    font-weight: 400;
    text-align: center;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .scripture-container.projection-mode .verse-text {
    font-size: 56px;
    line-height: 1.6;
    font-weight: 300;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.5px;
  }
  
  .verse-reference {
    color: #4caf50;
    font-style: italic;
    font-size: 18px;
    font-weight: 500;
    margin-top: 25px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .scripture-container.projection-mode .verse-reference {
    font-size: 32px;
    margin-top: 40px;
    color: #4caf50;
    text-shadow: 0 3px 8px rgba(0, 0, 0, 0.6);
  }

  .verse-counter {
    position: absolute;
    top: 15px;
    right: 20px;
    background: rgba(252, 163, 17, 0.2);
    color: #4caf50;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid rgba(17, 252, 25, 0.3);
  }

  .empty-state {
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .empty-state svg {
    color: #4caf50;
    opacity: 0.7;
  }

  .empty-state h3 {
    font-size: 24px;
    color: #4caf50;
  }

  .empty-state p {
    font-size: 16px;
  }

  .navigation-section {
    margin-top: 30px;
  }
  
  .nav-buttons {
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .nav-button {
    padding: 16px 24px;
    font-size: 16px;
    background: linear-gradient(135deg, #4caf50 0%,rgb(62, 232, 15) 100%);
    color: #14213d;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    font-weight: 600;
    min-width: 120px;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(36, 252, 17, 0.3);
  }

  .scripture-container.projection-mode .nav-button {
    padding: 20px;
    border-radius: 50%;
    min-width: auto;
    width: 60px;
    height: 60px;
    position: fixed;
    bottom: 30px;
    box-shadow: 0 6px 20px rgba(44, 252, 17, 0.4);
  }

  .scripture-container.projection-mode .nav-button.prev {
    left: 30px;
  }

  .scripture-container.projection-mode .nav-button.next {
    right: 30px;
  }
  
  .nav-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(72, 252, 17, 0.4);
    background: linear-gradient(135deg,rgb(80, 232, 15) 0%,rgb(17, 214, 14) 100%);
  }

  .nav-button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .nav-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    background: rgba(255, 255, 255, 0.75);
    color: rgba(255, 255, 255, 0.5);
    box-shadow: none;
  }
  
  .font-controls {
    display: flex;
    align-items: center;
    gap: 15px;
    background: rgba(23, 79, 16, 0.1);
    padding: 12px 20px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .font-btn {
    background: rgba(107, 252, 17, 0.2);
    border: 1px solid rgba(107, 252, 17, 0.3);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    color: #4caf50;
    transition: all 0.3s ease;
  }

  .font-btn:hover {
    background: rgba(107, 252, 17, 0.3);
    transform: translateY(-1px);
  }

  .font-size-display {
    color: #4caf50;
    font-weight: 500;
    font-size: 14px;
    min-width: 45px;
    text-align: center;
  }
  
  .projection-toggle {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #4caf50 0%,rgb(15, 232, 73) 100%);
    color: #14213d;
    border: none;
    border-radius: 16px;
    padding: 16px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(17, 252, 44, 0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .scripture-container.projection-mode .projection-toggle {
    top: 30px;
    bottom: auto;
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .projection-toggle:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(33, 252, 17, 0.5);
  }

  .toggle-text {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (max-width: 768px) {
    .scripture-container {
      padding: 15px;
    }

    .header {
      flex-direction: column;
      gap: 20px;
      align-items: stretch;
    }

    .app-title {
      font-size: 24px;
      justify-content: center;
    }

    .controls-grid {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .verse-display {
      padding: 25px;
      min-height: 280px;
    }

    .verse-text {
      font-size: 24px;
    }

    .nav-buttons {
      flex-direction: column;
      gap: 15px;
    }

    .font-controls {
      order: -1;
    }

    .projection-toggle {
      bottom: 20px;
      right: 20px;
      padding: 12px 16px;
    }
  }

  @media (max-width: 480px) {
    .verse-text {
      font-size: 20px;
      line-height: 1.6;
    }

    .verse-reference {
      font-size: 16px;
    }

    .nav-button {
      padding: 12px 20px;
      font-size: 14px;
    }
  }
`;

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

export default ScriptureProjection;

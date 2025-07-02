import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Type, Book, Hash } from "lucide-react";

const ScriptureProjection = () => {
  // State hooks - must be called unconditionally at the top level
  const [bibleData, setBibleData] = useState({ nkjv: null, twi: null });
  const [isLoading, setIsLoading] = useState(true);
  const [activeBible, setActiveBible] = useState("nkjv");
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [verses, setVerses] = useState([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [fontSize, setFontSize] = useState(48); // Larger default for projection
  const [isProjectionMode, setIsProjectionMode] = useState(false);

  // Derived state
  const currentBible = bibleData[activeBible];
  const currentBook = currentBible?.books?.find(b => b.name === selectedBook);
  const currentVerse = verses[currentVerseIndex] || { text: '', reference: '' };
  
  // Helper functions
  const getBibleDisplayName = (bibleKey) => {
    return bibleKey === 'nkjv' ? 'NKJV (English)' : 'Twi Asem (Twi)';
  };

  useEffect(() => {
    const loadBibleData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching Bible data...');
        const [nkjvResponse, twiResponse] = await Promise.all([
          fetch("/newkjv.json"),
          fetch("/twiBible.json")
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

  useEffect(() => {
    console.log('Effect running with:', { 
      activeBible, 
      selectedBook, 
      selectedChapter, 
      hasBibleData: !!bibleData[activeBible],
      bookCount: bibleData[activeBible]?.books?.length || 0
    });
    
    if (!bibleData[activeBible] || !selectedBook || selectedChapter === null) {
      console.log('Skipping verse update - missing required data');
      return;
    }

    const book = currentBible.books.find(b => b.name === selectedBook);
    if (!book) return;

    const chapter = book.chapters.find(c => c.chapter === selectedChapter);
    if (!chapter) return;

    console.log('Processing chapter:', { 
      book: selectedBook, 
      chapter: selectedChapter, 
      verseCount: chapter.verses?.length || 0 
    });
    
    const versesList = chapter.verses.map(verse => ({
      id: `${selectedBook}-${selectedChapter}-${verse.verse}`,
      reference: `${selectedBook} ${selectedChapter}:${verse.verse}`,
      text: verse.text,
      verse: verse.verse
    }));
    
    console.log('Verses list created:', versesList.length > 0 ? `First verse: ${versesList[0].reference}` : 'No verses found');

    setVerses(versesList);
    setCurrentVerseIndex(0);
  }, [bibleData, activeBible, selectedBook, selectedChapter]);

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
  }, [activeBible, bibleData]);

  const handleChapterSelect = useCallback((chapterNum) => {
    setSelectedChapter(chapterNum);
    setCurrentVerseIndex(0);
  }, []);

  const toggleProjectionMode = useCallback(() => {
    setIsProjectionMode(prevMode => {
      const newMode = !prevMode;
      if (!newMode) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      } else if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      return newMode;
    });
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (isLoading) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && currentVerseIndex < verses.length - 1) {
        handleNextVerse();
      } else if (e.key === 'ArrowLeft' && currentVerseIndex > 0) {
        handlePreviousVerse();
      } else if (e.key === 'Escape' && isProjectionMode) {
        toggleProjectionMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVerseIndex, verses.length, isProjectionMode, handleNextVerse, handlePreviousVerse, toggleProjectionMode, isLoading]);

  if (isLoading) {
    return (
      <div className="scripture-container loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading Scripture...</h2>
          <p>Please wait while we prepare the Word</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`scripture-container ${isProjectionMode ? 'projection-mode' : ''}`}>
      <style>{styles}</style>
      
      {!isProjectionMode && (
        <>
          <div className="header">
            <h1 className="app-title">
              <Book className="title-icon" />
              Scripture Projection
            </h1>
            <div className="bible-switcher">
              <button 
                className={`bible-tab ${activeBible === 'nkjv' ? 'active' : ''}`}
                onClick={() => setActiveBible('nkjv')}
              >
                English (NKJV)
              </button>
              <button 
                className={`bible-tab ${activeBible === 'twi' ? 'active' : ''}`}
                onClick={() => setActiveBible('twi')}
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
                onChange={(e) => handleChapterSelect(Number(e.target.value))}
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
        </>
      )}

      <div className="verse-display">
        {currentVerse.text ? (
          <div className="verse-content">
            <div 
              className="verse-text" 
              style={{ fontSize: `${fontSize}px` }}
              dir={activeBible === 'twi' ? 'rtl' : 'ltr'}
            >
              {currentVerse.text}
            </div>
            <div className="verse-reference">
              {currentVerse.reference}
            </div>
            {!isProjectionMode && (
              <div className="verse-counter">
                Verse {currentVerseIndex + 1} of {verses.length}
              </div>
            )}
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
            {!isProjectionMode && <span>Previous</span>}
          </button>
          
          {!isProjectionMode && (
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
          )}
          
          <button 
            onClick={handleNextVerse}
            disabled={currentVerseIndex >= verses.length - 1}
            className="nav-button next"
          >
            {!isProjectionMode && <span>Next</span>}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <button 
        className="projection-toggle"
        onClick={toggleProjectionMode}
        title={isProjectionMode ? 'Exit Projection Mode' : 'Enter Projection Mode'}
      >
        {isProjectionMode ? <Minimize size={20} /> : <Maximize size={20} />}
        <span className="toggle-text">
          {isProjectionMode ? 'Exit' : 'Present'}
        </span>
      </button>
    </div>
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
    background: linear-gradient(135deg, #14213d 0%, #1a2951 50%, #0f1629 100%);
    padding: 20px;
    transition: all 0.4s ease;
  }

  .scripture-container.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-content {
    text-align: center;
    color: #ffffff;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid #4caf50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-content h2 {
    font-size: 24px;
    margin-bottom: 10px;
    color: #4caf50;
  }

  .loading-content p {
    opacity: 0.7;
    font-size: 16px;
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
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

export default ScriptureProjection;
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Minimize, Book, X, Maximize2, Minimize2, Music, Globe } from 'lucide-react';
import { marked } from 'marked';
import { getBackgroundStyle, getDesignById } from './utils/backgroundDesigns';
import ProjectionView from './components/ProjectionView';

const ProjectionPage = () => {
  const [projectionData, setProjectionData] = useState(null);
  const [projectionLanguage, setProjectionLanguage] = useState('nkjv');
  const [showBothLanguages, setShowBothLanguages] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [currentStanza, setCurrentStanza] = useState(0);
  const [hymnLanguage, setHymnLanguage] = useState('twi');
  const [chorusMode, setChorusMode] = useState('together');
  const [hymnFontSize, setHymnFontSize] = useState(28);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const removeInitialListener = window.api?.onProjectionData?.((payload) => {
      const nextData = payload?.data || payload || null;
      setProjectionData((prev) => ({ ...(prev || {}), ...(nextData || {}), type: payload?.type || nextData?.type || prev?.type }));
      setProjectionLanguage(nextData?.projectionLanguage || 'nkjv');
      setShowBothLanguages(Boolean(nextData?.showBothLanguages));
      setCurrentVerseIndex(Number(nextData?.verseIndex ?? 0));
    });

    const removeUpdateListener = window.api?.onProjectionDataUpdate?.((payload) => {
      const nextData = payload?.data || payload || null;
      setProjectionData((prev) => ({ ...(prev || {}), ...(nextData || {}), type: prev?.type || nextData?.type || 'scripture' }));
      if (nextData?.projectionLanguage) {
        setProjectionLanguage(nextData.projectionLanguage);
      }
      if (typeof nextData?.showBothLanguages === 'boolean') {
        setShowBothLanguages(nextData.showBothLanguages);
      }
      if (typeof nextData?.verseIndex === 'number') {
        setCurrentVerseIndex(nextData.verseIndex);
      }
    });

    return () => {
      removeInitialListener?.();
      removeUpdateListener?.();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateCurrentProjection = async () => {
      if (!window.api?.getProjectionStatus) {
        return;
      }

      try {
        const status = await window.api.getProjectionStatus();
        const currentPayload = status?.data?.data || status?.data || null;
        const currentType = status?.data?.type || currentPayload?.type || null;

        if (!isMounted || !status?.isActive || !currentPayload) {
          return;
        }

        setProjectionData((prev) => ({ ...(prev || {}), ...(currentPayload || {}), type: currentType || prev?.type }));
        if (currentPayload?.projectionLanguage) {
          setProjectionLanguage(currentPayload.projectionLanguage);
        }
        if (typeof currentPayload?.showBothLanguages === 'boolean') {
          setShowBothLanguages(currentPayload.showBothLanguages);
        }
        if (typeof currentPayload?.verseIndex === 'number') {
          setCurrentVerseIndex(currentPayload.verseIndex);
        }
        if (typeof currentPayload?.currentStanza === 'number') {
          setCurrentStanza(currentPayload.currentStanza);
        }
        if (currentPayload?.language) {
          setHymnLanguage(currentPayload.language);
        }
        if (currentPayload?.chorusMode) {
          setChorusMode(currentPayload.chorusMode);
        }
        if (currentPayload?.fontSize) {
          setHymnFontSize(Number(currentPayload.fontSize));
        }
      } catch {
        // Keep the loading screen if projection status is unavailable.
      }
    };

    hydrateCurrentProjection();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!(projectionData?.type === 'hymn' || projectionData?.hymn)) {
      return;
    }

    setCurrentStanza(Number(projectionData?.currentStanza ?? 0));
    setHymnLanguage(projectionData?.language || 'twi');
    setChorusMode(projectionData?.chorusMode || 'together');
    setHymnFontSize(Number(projectionData?.fontSize ?? 28));
  }, [projectionData]);

  useEffect(() => {
    if (!(projectionData?.type === 'hymn' || projectionData?.hymn)) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentStanza((value) => value + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentStanza((value) => Math.max(0, value - 1));
      } else if (event.key === 'Escape') {
        window.api?.closeProjection?.();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [projectionData]);

  const bibleData = projectionData?.bibleData || null;
  const verseList = projectionData?.verseList || [];
  const verse = verseList[currentVerseIndex] || projectionData?.verse || null;
  const totalVerses = projectionData?.totalVerses || verseList.length || 0;
  const fontSize = projectionData?.fontSize || 48;
  const projectionType = projectionData?.type || (projectionData?.priority && projectionData?.content ? 'announcement' : projectionData?.hymn ? 'hymn' : 'scripture');
  const hymn = projectionData?.hymn || (projectionType === 'hymn' ? projectionData : null);
  const templateBackgroundMode = projectionData?.backgroundMode || (projectionData?.backgroundDesignId ? 'design' : 'color');
  const templateDesign = templateBackgroundMode === 'design' ? (getDesignById(projectionData?.backgroundDesignId) || {}) : {};
  const templateDesignStyle = templateBackgroundMode === 'design' ? getBackgroundStyle(templateDesign) : {};
  const templateBackgroundStyle = templateBackgroundMode === 'design'
    ? {
        ...templateDesignStyle,
        backgroundColor: 'transparent',
        backgroundImage: projectionData?.backgroundImage
          ? `url(${projectionData.backgroundImage})`
          : templateDesignStyle.backgroundImage,
        backgroundSize: projectionData?.backgroundImage ? 'cover' : templateDesignStyle.backgroundSize,
        backgroundPosition: projectionData?.backgroundImage ? 'center' : templateDesignStyle.backgroundPosition,
      }
    : {
        backgroundColor: projectionData?.backgroundColor || '#ffffff',
        backgroundImage: projectionData?.backgroundImage ? `url(${projectionData.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };

  let hymnProjectionMarkup = null;

  if (projectionType === 'hymn' && hymn) {
    const hymnData = hymn[hymnLanguage] || hymn.twi || hymn.english || { title: '', stanzas: [] };
    const chorus = hymn.chorus?.[hymnLanguage] || '';
    const stanzas = hymnData.stanzas || [];
    const hasChorus = Boolean(chorus.trim());
    const totalItems = chorusMode === 'after-each' && hasChorus ? stanzas.length * 2 : stanzas.length;
    const hasStanzas = stanzas.length > 0;

    const updateHymnProjection = (patch) => {
      window.api?.updateProjection?.({
        ...projectionData,
        type: 'hymn',
        hymn,
        language: hymnLanguage,
        currentStanza,
        chorusMode,
        fontSize: hymnFontSize,
        ...patch,
      });
    };

    const prevStanza = () => {
      if (currentStanza > 0) {
        const nextValue = currentStanza - 1;
        setCurrentStanza(nextValue);
        updateHymnProjection({ currentStanza: nextValue });
      }
    };

    const nextStanza = () => {
      if (hasStanzas && currentStanza < totalItems - 1) {
        const nextValue = currentStanza + 1;
        setCurrentStanza(nextValue);
        updateHymnProjection({ currentStanza: nextValue });
      }
    };

    const toggleFullscreen = async () => {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    };

    const decreaseFontSize = () => {
      const nextValue = Math.max(16, hymnFontSize - 2);
      setHymnFontSize(nextValue);
      updateHymnProjection({ fontSize: nextValue });
    };

    const increaseFontSize = () => {
      const nextValue = Math.min(56, hymnFontSize + 2);
      setHymnFontSize(nextValue);
      updateHymnProjection({ fontSize: nextValue });
    };

    const resetFontSize = () => {
      setHymnFontSize(28);
      updateHymnProjection({ fontSize: 28 });
    };

    hymnProjectionMarkup = (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', zIndex: 1000, display: 'flex', flexDirection: 'column', color: 'white' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, background: 'linear-gradient(135deg, #4caf50, #81c784)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {hymn.number}. {hymnData.title || 'No title'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <button onClick={() => { const nextLanguage = hymnLanguage === 'twi' ? 'english' : 'twi'; setHymnLanguage(nextLanguage); updateHymnProjection({ language: nextLanguage }); }} style={{ background: 'rgba(76, 175, 80, 0.2)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '8px', padding: '0.375rem 0.75rem', color: '#4caf50', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <Globe size={14} style={{ marginRight: '0.5rem' }} />
                Switch to {hymnLanguage === 'twi' ? 'English' : 'Twi'}
              </button>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.375rem 0.75rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {chorusMode === 'after-each' && hasChorus ? `Item ${currentStanza + 1} of ${totalItems}` : `Verse ${currentStanza + 1} of ${stanzas.length || 1}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {hasChorus && (
              <>
                <button onClick={() => { const nextMode = chorusMode === 'together' ? 'after-each' : 'together'; setChorusMode(nextMode); updateHymnProjection({ chorusMode: nextMode }); }} style={{ background: 'rgba(76, 175, 80, 0.2)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '12px', padding: '0.75rem', color: '#4caf50', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', minWidth: '44px', height: '44px' }} title={chorusMode === 'together' ? 'Show chorus after each verse' : 'Show chorus together'}>
                  <Music size={16} style={{ marginRight: '0.5rem' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{chorusMode === 'together' ? 'Chorus Mode: Together' : 'Chorus Mode: After Each'}</span>
                </button>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.2)' }} />
              </>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={decreaseFontSize} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px', padding: '0.75rem', color: 'white', cursor: hymnFontSize <= 16 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', minWidth: '44px', height: '44px', opacity: hymnFontSize <= 16 ? 0.5 : 1 }} disabled={hymnFontSize <= 16} title="Decrease text size"><span style={{ fontSize: '0.875rem', fontWeight: '600' }}>A-</span></button>
              <button onClick={resetFontSize} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px', padding: '0.75rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', minWidth: '44px', height: '44px' }} title="Reset text size"><span style={{ fontSize: '1rem', fontWeight: '600' }}>A</span></button>
              <button onClick={increaseFontSize} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px', padding: '0.75rem', color: 'white', cursor: hymnFontSize >= 56 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', minWidth: '44px', height: '44px', opacity: hymnFontSize >= 56 ? 0.5 : 1 }} disabled={hymnFontSize >= 56} title="Increase text size"><span style={{ fontSize: '1.125rem', fontWeight: '600' }}>A+</span></button>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.2)' }} />
            <button onClick={toggleFullscreen} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px', padding: '0.75rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', minWidth: '44px', height: '44px' }} title="Toggle fullscreen">{isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
            <button onClick={() => window.api?.closeProjection?.()} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '0.75rem', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', minWidth: '44px', height: '44px' }} title="Close"><X size={20} /></button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', paddingTop: '3rem', position: 'relative', overflow: 'auto' }}>
          {hasStanzas && (
            <div style={{ width: '100%', maxWidth: '1200px', position: 'relative' }}>
              <button onClick={prevStanza} disabled={currentStanza === 0} style={{ position: 'absolute', left: '-4rem', top: '50%', transform: 'translateY(-50%)', background: currentStanza === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentStanza === 0 ? 'not-allowed' : 'pointer', opacity: currentStanza === 0 ? 0.3 : 1, transition: 'all 0.3s ease', color: 'white' }}><ChevronLeft size={24} /></button>
              <button onClick={nextStanza} disabled={!hasStanzas || currentStanza >= totalItems - 1} style={{ position: 'absolute', right: '-4rem', top: '50%', transform: 'translateY(-50%)', background: !hasStanzas || currentStanza >= totalItems - 1 ? 'transparent' : 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !hasStanzas || currentStanza >= totalItems - 1 ? 'not-allowed' : 'pointer', opacity: !hasStanzas || currentStanza >= totalItems - 1 ? 0.3 : 1, transition: 'all 0.3s ease', color: 'white' }}><ChevronRight size={24} /></button>
              <div style={{ textAlign: 'center', padding: '0 6rem' }}>
                {chorusMode === 'after-each' && hasChorus ? (
                  <>
                    {currentStanza % 2 === 0 ? (
                      stanzas[Math.floor(currentStanza / 2)] && <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '3rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}><pre style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0, textAlign: 'center', lineHeight: '1.8', fontSize: `${hymnFontSize}px`, color: 'white', fontWeight: '400' }}>{stanzas[Math.floor(currentStanza / 2)]}</pre></div>
                    ) : (
                      <div style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))', borderRadius: '20px', padding: '2rem', border: '1px solid rgba(76, 175, 80, 0.3)', backdropFilter: 'blur(10px)' }}><h3 style={{ fontSize: `${hymnFontSize * 0.8}px`, fontWeight: '600', color: '#4caf50', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{hymnLanguage === 'twi' ? 'Nnyesoo' : 'Chorus'}</h3><pre style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0, textAlign: 'center', lineHeight: '1.8', fontSize: `${hymnFontSize}px`, color: 'white', fontWeight: '400' }}>{chorus}</pre></div>
                    )}
                  </>
                ) : (
                  <>
                    {stanzas[currentStanza] && <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '3rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}><pre style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0, textAlign: 'center', lineHeight: '1.8', fontSize: `${hymnFontSize}px`, color: 'white', fontWeight: '400' }}>{stanzas[currentStanza]}</pre></div>}
                    {hasChorus && <div style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))', borderRadius: '20px', padding: '2rem', border: '1px solid rgba(76, 175, 80, 0.3)', backdropFilter: 'blur(10px)' }}><h3 style={{ fontSize: `${hymnFontSize * 0.8}px`, fontWeight: '600', color: '#4caf50', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{hymnLanguage === 'twi' ? 'Nnyesoo' : 'Chorus'}</h3><pre style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0, textAlign: 'center', lineHeight: '1.8', fontSize: `${hymnFontSize}px`, color: 'white', fontWeight: '400' }}>{chorus}</pre></div>}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button onClick={prevStanza} disabled={currentStanza === 0} style={{ background: currentStanza === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(76, 175, 80, 0.2)', border: `1px solid ${currentStanza === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(76, 175, 80, 0.3)'}`, borderRadius: '12px', padding: '0.75rem 1.5rem', color: currentStanza === 0 ? 'rgba(255, 255, 255, 0.4)' : '#4caf50', fontSize: '0.875rem', fontWeight: '500', cursor: currentStanza === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}><ChevronLeft size={16} />Previous {chorusMode === 'after-each' ? 'Item' : 'Verse'}</button>
          <button onClick={nextStanza} disabled={!hasStanzas || currentStanza >= totalItems - 1} style={{ background: !hasStanzas || currentStanza >= totalItems - 1 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(76, 175, 80, 0.2)', border: `1px solid ${!hasStanzas || currentStanza >= totalItems - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(76, 175, 80, 0.3)'}`, borderRadius: '12px', padding: '0.75rem 1.5rem', color: !hasStanzas || currentStanza >= totalItems - 1 ? 'rgba(255, 255, 255, 0.4)' : '#4caf50', fontSize: '0.875rem', fontWeight: '500', cursor: !hasStanzas || currentStanza >= totalItems - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}>Next {chorusMode === 'after-each' ? 'Item' : 'Verse'}<ChevronRight size={16} /></button>
        </div>
      </div>
    );
  }

  const cleanTwiText = (text) => {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.,;:!?])\s*([.,;:!?])/g, '$1$2')
      .replace(/\.\s+\./g, '.')
      .trim();
  };

  const normalizeBookName = (name) => {
    if (!name) return '';
    return name
      .replace(/^I\s/, '1 ')
      .replace(/^II\s/, '2 ')
      .replace(/^III\s/, '3 ')
      .toLowerCase()
      .trim();
  };

  const normalizeChapterOrVerse = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = Number(value);
    return Number.isNaN(normalized) ? String(value).trim() : normalized;
  };

  const resolveVerseText = React.useCallback((books, bookName, chapterNumber, verseNumber, shouldClean = false) => {
    const chapter = books?.books
      ?.find((book) => normalizeBookName(book.name) === normalizeBookName(bookName))
      ?.chapters?.find((chapterItem) => normalizeChapterOrVerse(chapterItem.chapter) === normalizeChapterOrVerse(chapterNumber));

    const matchedVerse = chapter?.verses?.find((verseItem) => normalizeChapterOrVerse(verseItem.verse) === normalizeChapterOrVerse(verseNumber));
    const text = matchedVerse?.text || '';
    return shouldClean ? cleanTwiText(text) : text;
  }, []);

  const verseBook = projectionData?.book || projectionData?.verse?.reference?.split(' ')[0] || '';
  const verseChapter = projectionData?.chapter ?? projectionData?.verse?.reference?.split(':')?.[0]?.split(' ')?.pop();
  const verseNumber = projectionData?.verse?.verse || verse?.verse || 0;

  const englishText = useMemo(() => {
    if (projectionData?.englishText) return projectionData.englishText;
    if (projectionData?.englishVerse) return projectionData.englishVerse;
    if (!bibleData || !verseBook || !verseChapter || !verseNumber) return '';
    return resolveVerseText(bibleData.nkjv, verseBook, Number(verseChapter), verseNumber);
  }, [bibleData, projectionData?.englishText, projectionData?.englishVerse, verseBook, verseChapter, verseNumber, resolveVerseText]);

  const twiText = useMemo(() => {
    if (projectionData?.twiText) return projectionData.twiText;
    if (projectionData?.twiVerse) return projectionData.twiVerse;
    if (!bibleData || !verseBook || !verseChapter || !verseNumber) return '';
    return resolveVerseText(bibleData.twi, verseBook, Number(verseChapter), verseNumber, true);
  }, [bibleData, projectionData?.twiText, projectionData?.twiVerse, verseBook, verseChapter, verseNumber, resolveVerseText]);

  const styles = useMemo(() => `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body, #root {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #ffffff;
    }

    .projection-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      color: white;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
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

    .projection-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #4caf50;
      min-width: fit-content;
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

    if (!projectionData) {
      return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Loading projection</div>
            <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.72)' }}>Preparing the second screen display...</div>
          </div>
        </div>
      );
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
  `, []);

  const isTemplateProjection = projectionType === 'template' || Boolean(projectionData?.isTemplate);

  if (projectionType === 'template') {
    const templateHtml = marked.parse(projectionData?.content || '*No content to preview*');

    return (
      <div className="projection-overlay">
        <div className="projection-display" style={{ ...templateBackgroundStyle, position: 'relative' }}>
          <div className="projection-overlay-layer"></div>

          <button
            onClick={() => window.api?.closeProjection?.()}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(15,23,42,0.72)',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.24)',
            }}
            title="Exit Projection"
          >
            <X size={18} />
            Exit
          </button>

          <div className="projection-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '1400px',
                backgroundColor: projectionData?.backgroundImage ? 'rgba(255, 255, 255, 0.94)' : 'transparent',
                color: projectionData?.fontColor || '#111827',
                fontFamily: projectionData?.fontFamily || 'Arial, sans-serif',
                fontSize: projectionData?.fontSize || '18px',
                lineHeight: projectionData?.lineHeight || 1.4,
                textAlign: projectionData?.textAlign || 'left',
                padding: projectionData?.padding || '2rem',
                borderRadius: projectionData?.borderRadius || '0.5rem',
                fontWeight: projectionData?.fontWeight || '400',
                textShadow: projectionData?.textShadow || 'none',
                opacity: projectionData?.opacity ?? 1,
                boxSizing: 'border-box',
              }}
            >
              {projectionData?.title && (
                <h1 style={{ margin: '0 0 1.5rem', fontSize: '2rem', lineHeight: 1.2 }}>
                  {projectionData.title}
                </h1>
              )}
              <div dangerouslySetInnerHTML={{ __html: templateHtml }} />
            </div>
          </div>

          <div
            className="projection-hint"
            style={{
              color: projectionData?.fontColor || '#111827',
            }}
          >
            <kbd>ESC</kbd> to exit
          </div>
        </div>
      </div>
    );
  }

  if (projectionType === 'announcement' || isTemplateProjection) {
    const announcement = projectionData?.announcement || projectionData;

    return (
      <ProjectionView
        announcement={announcement}
        onClose={() => window.api?.closeProjection?.()}
        backgroundDesignId={announcement?.backgroundDesignId}
        isTemplate={isTemplateProjection}
      />
    );
  }

  if (hymnProjectionMarkup) {
    return hymnProjectionMarkup;
  }

  const changeVerse = (delta) => {
    setCurrentVerseIndex((prev) => {
      const next = Math.max(0, Math.min(prev + delta, Math.max(totalVerses - 1, 0)));
      const nextPayload = {
        ...projectionData,
        verseIndex: next,
        verse: verseList[next] || projectionData?.verse || null,
      };
      setProjectionData(nextPayload);
      window.api?.updateProjection?.(nextPayload);
      return next;
    });
  };

  const hasVerse = Boolean(verse?.text || englishText || twiText);

  // Build background style for scripture projection
  const scriptureBackgroundStyle = templateBackgroundMode === 'design' 
    ? templateBackgroundStyle 
    : { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' };

  return (
    <div className="projection-overlay" style={scriptureBackgroundStyle}>
      <style>{styles}</style>

      <div className="projection-header">
        <div className="projection-title">
          <Book size={24} />
          <span>{projectionData?.reference || verse?.reference || 'Scripture'}</span>
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
          onClick={() => window.api?.closeProjection?.()}
          title="Exit Projection Mode"
          style={{ minWidth: 'fit-content' }}
        >
          <Minimize size={20} />
          <span>Exit</span>
        </button>
      </div>

      {hasVerse ? (
        <>
          <div className="projection-content">
            <div className="projection-verse-container">
              {showBothLanguages ? (
                <div className="projection-both-languages">
                  <div className="projection-language-column">
                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      English (NKJV)
                    </div>
                    <div className="projection-verse-text" style={{ fontSize: `${fontSize}px`, color: '#ffffff' }}>
                      {englishText}
                    </div>
                  </div>
                  <div className="projection-language-column">
                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Twi Asem
                    </div>
                    <div className="projection-verse-text" style={{ fontSize: `${fontSize}px`, color: '#10b981' }}>
                      {cleanTwiText(twiText)}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="projection-verse-text" style={{ fontSize: `${fontSize}px`, color: projectionLanguage === 'twi' ? '#10b981' : '#ffffff' }}>
                    {projectionLanguage === 'twi' ? cleanTwiText(twiText) : englishText}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => changeVerse(-1)} disabled={currentVerseIndex === 0} className="projection-nav-btn projection-prev" title="Previous Verse">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => changeVerse(1)} disabled={currentVerseIndex >= totalVerses - 1} className="projection-nav-btn projection-next" title="Next Verse">
            <ChevronRight size={24} />
          </button>

          <div className="projection-footer">
            <button onClick={() => changeVerse(-1)} disabled={currentVerseIndex === 0} className="projection-footer-btn">
              <ChevronLeft size={16} />
              Previous Verse
            </button>
            <button onClick={() => changeVerse(1)} disabled={currentVerseIndex >= totalVerses - 1} className="projection-footer-btn">
              Next Verse
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="projection-verse-counter">
            Verse {currentVerseIndex + 1} of {totalVerses}
          </div>
        </>
      ) : (
        <div className="projection-content" style={{ justifyContent: 'center' }}>
          <div className="projection-verse-container">
            <div className="projection-verse-text" style={{ fontSize: `${fontSize}px` }}>
              Projection ready
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectionPage;

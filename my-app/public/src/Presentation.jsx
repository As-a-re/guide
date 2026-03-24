import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { X, Plus, Minus, RefreshCw } from "lucide-react"
import "./Presentation.css"

// Helper to read from localStorage
const readJSON = (key, fallback) => {
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

const Presentation = () => {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState(null)
  const [fontSize, setFontSize] = useState(20)

  // Add verse state
  const [currentBook, setCurrentBook] = useState("")
  const [currentChapter, setCurrentChapter] = useState(1)
  const [currentVerse, setCurrentVerse] = useState(1)
  const [currentVerseText, setCurrentVerseText] = useState("")

  // Language toggle: 'english', 'twi', 'both'
  const [language, setLanguage] = useState("english")
  const [twiBible, setTwiBible] = useState([])

  // Load Twi Bible once
  useEffect(() => {
    fetch("/twiBible.json")
      .then((res) => res.json())
      .then((data) => setTwiBible(data))
      .catch(() => setTwiBible([]))
  }, [])

  useEffect(() => {
    // Load templates from localStorage
    const templates = readJSON("sg_sermonTemplates", [])
    const foundTemplate = templates.find((t) => t.id === templateId)

    if (foundTemplate) {
      setTemplate(foundTemplate)
      setFontSize(parseInt(foundTemplate.fontSize) || 20)
      // Initialize verse state from template if available
      if (foundTemplate.verse) {
        setCurrentBook(foundTemplate.verse.book || "Genesis")
        setCurrentChapter(foundTemplate.verse.chapter || 1)
        setCurrentVerse(foundTemplate.verse.verse || 1)
        setCurrentVerseText(foundTemplate.verse.text || "")
      } else {
        setCurrentBook("Genesis")
        setCurrentChapter(1)
        setCurrentVerse(1)
        setCurrentVerseText("")
      }
    } else {
      // Template not found, redirect back to settings
      alert("Template not found!")
      navigate("/settings")
    }
  }, [templateId, navigate])

  // ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        navigate(-1) // Go back to previous page
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate])

  const updateFontSize = (delta) => {
    setFontSize((prev) => Math.max(12, Math.min(72, prev + delta)))
  }

  const resetFontSize = () => {
    setFontSize(parseInt(template?.fontSize) || 20)
  }

  const handleExit = () => {
    navigate(-1) // Go back to previous page
  }

  // Get Twi verse for current reference
  const getTwiVerse = () => {
    const ref = `${currentBook} ${currentChapter}:${currentVerse}`
    const found = twiBible.find((v) => v.ref === ref)
    return found ? found.text : "Twi translation not found."
  }

  // Language toggle handler
  const handleLanguageChange = (lang) => setLanguage(lang)

  if (!template) {
    return (
      <div className="presentation-loading">
        <p>Loading presentation...</p>
      </div>
    )
  }

  return (
    <div className="presentation-page">
      {/* Control Bar */}
      <div className="presentation-header">
        <div className="presentation-title-section">
          <button className="exit-button" onClick={handleExit} title="Exit Presentation (ESC)">
            <X size={20} />
            <span>Exit</span>
          </button>
          <div className="presentation-title-info" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Book and verse reference */}
            <span style={{ color: "#10b981", fontSize: "1.3rem", fontWeight: 600 }}>
              {currentBook} {currentChapter}:{currentVerse}
            </span>
            {/* Template title/type info (optional) */}
            {template.title && (
              <h3 style={{ marginLeft: "1.5rem" }}>{template.title}</h3>
            )}
            {template.type && (
              <span className="presentation-type-badge" style={{ marginLeft: "0.5rem" }}>
                {template.type?.replace("_", " ") || "Template"}
              </span>
            )}
          </div>
        </div>

        <div className="presentation-controls">
          {/* Font Size Controls */}
          <div className="font-size-controls">
            <span className="control-label">Font Size:</span>
            <button
              onClick={() => updateFontSize(-2)}
              className="control-btn"
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              <Minus size={18} />
            </button>
            <span className="font-size-display">{fontSize}px</span>
            <button
              onClick={() => updateFontSize(2)}
              className="control-btn"
              title="Increase font size"
              aria-label="Increase font size"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={resetFontSize}
              className="control-btn"
              title="Reset font size"
              aria-label="Reset font size"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        className="presentation-content"
        style={{
          backgroundColor: template.backgroundColor || "#0b1220",
          color: template.fontColor || "#ffffff",
          fontFamily: template.fontFamily || "Arial, sans-serif",
          backgroundImage: template.backgroundImage
            ? `url(${template.backgroundImage})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="presentation-content-inner"
          style={{
            backgroundColor: template.backgroundImage
              ? "rgba(0, 0, 0, 0.75)"
              : "rgba(255, 255, 255, 0.04)",
            backdropFilter: template.backgroundImage ? "blur(8px)" : "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Verse display logic and rest of content */}
          <div
            className="presentation-text"
            style={{
              color: template.fontColor || "#ffffff",
              fontSize: "2.5rem",
              lineHeight: template.lineHeight || 1.6,
              textAlign: template.textAlign || "center",
              fontWeight: template.fontWeight || "400",
              textShadow: template.backgroundImage
                ? "0 2px 4px rgba(0, 0, 0, 0.8)"
                : template.textShadow || "none",
              marginBottom: "2rem",
            }}
          >
            {language === "english" && (
              <span style={{ color: "white", fontSize: "2.5rem", fontWeight: 600 }}>{currentVerseText}</span>
            )}
            {language === "twi" && (
              <span style={{ color: "#10b981", fontSize: "2.5rem", fontWeight: 600 }}>{getTwiVerse()}</span>
            )}
            {language === "both" && (
              <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
                <span style={{ color: "white", fontSize: "2.5rem", fontWeight: 600 }}>{currentVerseText}</span>
                <span style={{ color: "#10b981", fontSize: "2.5rem", fontWeight: 600 }}>{getTwiVerse()}</span>
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: "2rem",
              color: "#10b981",
              fontStyle: "italic",
              fontSize: "1.5rem",
              textAlign: "center",
            }}
          >
            {currentBook} {currentChapter}:{currentVerse}
          </div>
        </div>
      </div>

      {/* Language toggle section - always visible, styled */}
      <div className="language-toggle">
        <button
          className={`language-btn${language === "english" ? " active" : ""}`}
          onClick={() => handleLanguageChange("english")}
        >
          English
        </button>
        <button
          className={`language-btn${language === "twi" ? " active" : ""}`}
          onClick={() => handleLanguageChange("twi")}
        >
          Twi
        </button>
        <button
          className={`language-btn${language === "both" ? " active" : ""}`}
          onClick={() => handleLanguageChange("both")}
        >
          Both
        </button>
      </div>

      {/* Footer Info */}
      <div className="presentation-footer">
        <span>Press ESC to exit presentation mode</span>
        <span>Church Management System</span>
      </div>
    </div>
  )
}

export default Presentation

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, BookOpen, X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Music, Globe, Grid, List} from "lucide-react"

// Parse the raw text into structured hymn data while preserving original formatting
const parseHymnsText = (text) => {
  const hymns = []
  let currentHymn = null

  // Split the text into lines and process each line
  const lines = text.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Check for new hymn
    const hymnMatch = line.match(/^Hymn (\d+) (Twi|English)/i)
    if (hymnMatch) {
      const hymnNumber = Number.parseInt(hymnMatch[1], 10)
      const language = hymnMatch[2].toLowerCase()

      // Find or create the hymn
      let hymn = hymns.find((h) => h.number === hymnNumber)
      if (!hymn) {
        hymn = {
          id: hymnNumber,
          number: hymnNumber,
          twi: { title: "", stanzas: [] },
          english: { title: "", stanzas: [] },
          chorus: { twi: "", english: "" },
        }
        hymns.push(hymn)
      }

      currentHymn = hymn
      // Skip to next line
      i++

      // Get the title (first non-empty line after hymn header)
      while (i < lines.length) {
        const titleLine = lines[i].trim()
        if (titleLine) {
          currentHymn[language].title = titleLine
          i++
          break
        }
        i++
      }

      // Process stanzas and chorus
      const currentStanza = null

      while (i < lines.length) {
        const stanzaLine = lines[i].trim()

        // Check for end of hymn
        if (stanzaLine.match(/^Hymn \d+ (Twi|English)/i)) {
          i-- // Move back so the next iteration can process this line
          break
        }

        // Skip empty lines unless we're in a stanza
        if (!stanzaLine && !currentStanza) {
          i++
          continue
        }

        // Check for chorus
        if (stanzaLine.match(/^(Nnyesoo|Chorus)/i)) {
          const chorusLines = [stanzaLine]
          i++

          // Collect all chorus lines until next stanza or end of hymn
          while (i < lines.length) {
            const chorusLine = lines[i].trim()
            if (chorusLine.match(/^\d+\./) || chorusLine.match(/^Hymn \d+ (Twi|English)/i)) {
              i-- // Move back to process this line in the next iteration
              break
            }
            if (chorusLine) {
              chorusLines.push(chorusLine)
            }
            i++
          }

          currentHymn.chorus[language] = chorusLines.join("\n")
          continue
        }

        // Handle stanza numbers (e.g., "1.", "2.")
        const stanzaMatch = stanzaLine.match(/^(\d+)\.\s*(.*)/)
        if (stanzaMatch) {
          const stanzaNumber = Number.parseInt(stanzaMatch[1], 10)
          const stanzaContent = stanzaMatch[2] ? [stanzaMatch[2]] : []

          // Add empty stanzas if needed
          while (currentHymn[language].stanzas.length < stanzaNumber - 1) {
            currentHymn[language].stanzas.push("")
          }

          // Get the rest of the stanza lines
          i++
          while (i < lines.length) {
            const nextLine = lines[i].trim()
            if (
              !nextLine ||
              nextLine.match(/^\d+\./) ||
              nextLine.match(/^Hymn \d+ (Twi|English)/i) ||
              nextLine.match(/^(Nnyesoo|Chorus)/i)
            ) {
              i-- // Move back to process this line in the next iteration
              break
            }
            if (nextLine) {
              stanzaContent.push(nextLine)
            }
            i++
          }

          // Save the stanza
          if (stanzaNumber <= currentHymn[language].stanzas.length) {
            currentHymn[language].stanzas[stanzaNumber - 1] = stanzaContent.join("\n")
          } else {
            currentHymn[language].stanzas.push(stanzaContent.join("\n"))
          }

          i++
          continue
        }

        i++
      }

      continue
    }

    i++
  }

  return hymns.sort((a, b) => a.number - b.number)
}

const HymnCard = ({ hymn, language, onClick, isSelected, viewMode }) => {
  const otherLanguage = language === "twi" ? "english" : "twi"
  const [isHovered, setIsHovered] = useState(false)

  const cardStyle = {
    background: isSelected
      ? "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)",
    border: isSelected ? "2px solid #4caf50" : "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "16px",
    padding: viewMode === "grid" ? "1.5rem" : "1.25rem",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
    boxShadow: isHovered
      ? "0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(76, 175, 80, 0.1)"
      : "0 4px 20px rgba(0, 0, 0, 0.08)",
    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
    position: "relative",
    overflow: "hidden",
  }

  const numberBadgeStyle = {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "linear-gradient(135deg, #4caf50, #2e7d32)",
    color: "white",
    borderRadius: "12px",
    padding: "0.375rem 0.75rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
  }

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={numberBadgeStyle}>#{hymn.number}</div>

      <div style={{ paddingRight: "3rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #4caf50, #2e7d32)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              flexShrink: 0,
            }}
          >
            <Music size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: viewMode === "grid" ? "1.125rem" : "1rem",
                fontWeight: "700",
                color: "#1a202c",
                margin: 0,
                lineHeight: "1.3",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {hymn[language]?.title || "No title available"}
            </h3>
            {hymn[otherLanguage]?.title && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  margin: "0.25rem 0 0 0",
                  lineHeight: "1.4",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {hymn[otherLanguage].title}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#9ca3af",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Globe size={14} />
            <span style={{ textTransform: "capitalize" }}>{language}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span>{hymn[language]?.stanzas?.length || 0} verses</span>
            {hymn.chorus?.[language] && (
              <>
                <span>•</span>
                <span>Chorus</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hover indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #4caf50, #2e7d32)",
          transform: isHovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.3s ease",
        }}
      />
    </div>
  )
}

const HymnProjection = ({ hymn, onClose, language, onLanguageChange }) => {
  const [currentStanza, setCurrentStanza] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(28)
  const projectionRef = useRef(null)

  const increaseFontSize = () => setFontSize((prev) => Math.min(56, prev + 4))
  const decreaseFontSize = () => setFontSize((prev) => Math.max(16, prev - 4))
  const resetFontSize = () => setFontSize(28)

  const hasStanzas = hymn[language]?.stanzas?.length > 0
  const chorus = hymn.chorus?.[language]

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      projectionRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const nextStanza = useCallback(() => {
  if (hasStanzas && currentStanza < hymn[language].stanzas.length - 1) {
    setCurrentStanza(currentStanza + 1);
  }
}, [currentStanza, hasStanzas, hymn, language]);

const prevStanza = useCallback(() => {
  if (currentStanza > 0) {
    setCurrentStanza(currentStanza - 1);
  }
}, [currentStanza]);

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      nextStanza();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevStanza();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [nextStanza, onClose, prevStanza]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const projectionStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    color: "white",
  }

  const headerStyle = {
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "1.5rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }

  const controlButtonStyle = {
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    padding: "0.75rem",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    minWidth: "44px",
    height: "44px",
  }

  return (
    <div ref={projectionRef} style={projectionStyle}>
      {/* Enhanced Header */}
      <div style={headerStyle}>
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              margin: 0,
              background: "linear-gradient(135deg, #4caf50, #81c784)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {hymn.number}. {hymn[language]?.title || "No title"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
            <button
              onClick={() => onLanguageChange(language === "twi" ? "english" : "twi")}
              style={{
                background: "rgba(76, 175, 80, 0.2)",
                border: "1px solid rgba(76, 175, 80, 0.3)",
                borderRadius: "8px",
                padding: "0.375rem 0.75rem",
                color: "#4caf50",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <Globe size={14} style={{ marginRight: "0.5rem" }} />
              Switch to {language === "twi" ? "English" : "Twi"}
            </button>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.375rem 0.75rem",
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              Verse {currentStanza + 1} of {hymn[language]?.stanzas.length || 1}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* Font Size Controls */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={decreaseFontSize}
              style={{
                ...controlButtonStyle,
                opacity: fontSize <= 16 ? 0.5 : 1,
                cursor: fontSize <= 16 ? "not-allowed" : "pointer",
              }}
              disabled={fontSize <= 16}
              title="Decrease text size"
            >
              <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>A-</span>
            </button>
            <button onClick={resetFontSize} style={controlButtonStyle} title="Reset text size">
              <span style={{ fontSize: "1rem", fontWeight: "600" }}>A</span>
            </button>
            <button
              onClick={increaseFontSize}
              style={{
                ...controlButtonStyle,
                opacity: fontSize >= 56 ? 0.5 : 1,
                cursor: fontSize >= 56 ? "not-allowed" : "pointer",
              }}
              disabled={fontSize >= 56}
              title="Increase text size"
            >
              <span style={{ fontSize: "1.125rem", fontWeight: "600" }}>A+</span>
            </button>
          </div>

          <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.2)" }} />

          {/* Main Controls */}
          <button onClick={toggleFullscreen} style={controlButtonStyle} title="Toggle fullscreen">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={onClose}
            style={{
              ...controlButtonStyle,
              background: "rgba(239, 68, 68, 0.2)",
              borderColor: "rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "2rem",
          paddingTop: "3rem",
          position: "relative",
          overflow: "auto",
        }}
      >
        {hasStanzas && (
          <div style={{ width: "100%", maxWidth: "1200px", position: "relative" }}>
            {/* Navigation Arrows */}
            <button
              onClick={prevStanza}
              disabled={currentStanza === 0}
              style={{
                position: "absolute",
                left: "-4rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: currentStanza === 0 ? "transparent" : "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
                width: "56px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: currentStanza === 0 ? "not-allowed" : "pointer",
                opacity: currentStanza === 0 ? 0.3 : 1,
                transition: "all 0.3s ease",
              }}
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={nextStanza}
              disabled={!hasStanzas || currentStanza >= hymn[language].stanzas.length - 1}
              style={{
                position: "absolute",
                right: "-4rem",
                top: "50%",
                transform: "translateY(-50%)",
                background:
                  !hasStanzas || currentStanza >= hymn[language].stanzas.length - 1
                    ? "transparent"
                    : "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
                width: "56px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: !hasStanzas || currentStanza >= hymn[language].stanzas.length - 1 ? "not-allowed" : "pointer",
                opacity: !hasStanzas || currentStanza >= hymn[language].stanzas.length - 1 ? 0.3 : 1,
                transition: "all 0.3s ease",
              }}
            >
              <ChevronRight size={24} />
            </button>

            {/* Stanza Content */}
            <div style={{ textAlign: "center", padding: "0 6rem" }}>
              {hymn[language].stanzas[currentStanza] && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "24px",
                    padding: "3rem",
                    marginBottom: "2rem",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <pre
                    style={{
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      margin: 0,
                      textAlign: "center",
                      lineHeight: "1.8",
                      fontSize: `${fontSize}px`,
                      color: "white",
                      fontWeight: "400",
                    }}
                  >
                    {hymn[language].stanzas[currentStanza]}
                  </pre>
                </div>
              )}

              {/* Chorus */}
              {chorus && (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))",
                    borderRadius: "20px",
                    padding: "2rem",
                    border: "1px solid rgba(76, 175, 80, 0.3)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: `${fontSize * 0.8}px`,
                      fontWeight: "600",
                      color: "#4caf50",
                      margin: "0 0 1rem 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {language === "twi" ? "Nnyesoo" : "Chorus"}
                  </h3>
                  <pre
                    style={{
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      margin: 0,
                      textAlign: "center",
                      lineHeight: "1.8",
                      fontSize: `${fontSize}px`,
                      color: "white",
                      fontWeight: "400",
                    }}
                  >
                    {chorus}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Footer */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <button
          onClick={prevStanza}
          disabled={currentStanza === 0}
          style={{
            background: currentStanza === 0 ? "rgba(255, 255, 255, 0.05)" : "rgba(76, 175, 80, 0.2)",
            border: `1px solid ${currentStanza === 0 ? "rgba(255, 255, 255, 0.1)" : "rgba(76, 175, 80, 0.3)"}`,
            borderRadius: "12px",
            padding: "0.75rem 1.5rem",
            color: currentStanza === 0 ? "rgba(255, 255, 255, 0.4)" : "#4caf50",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: currentStanza === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.3s ease",
          }}
        >
          <ChevronLeft size={16} />
          Previous Verse
        </button>
        <button
          onClick={nextStanza}
          disabled={!hasStanzas || currentStanza >= hymn[language].stanzas.length - 1}
          style={{
            background:
              !hasStanzas || currentStanza >= hymn[language].stanzas.length - 1
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(76, 175, 80, 0.2)",
            border: `1px solid ${
              !hasStanzas || currentStanza >= hymn[language].stanzas.length - 1
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(76, 175, 80, 0.3)"
            }`,
            borderRadius: "12px",
            padding: "0.75rem 1.5rem",
            color:
              !hasStanzas || currentStanza >= hymn[language].stanzas.length - 1
                ? "rgba(255, 255, 255, 0.4)"
                : "#4caf50",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: !hasStanzas || currentStanza >= hymn[language].stanzas.length - 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.3s ease",
          }}
        >
          Next Verse
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

const Hymns = () => {
  const [hymns, setHymns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHymn, setSelectedHymn] = useState(null)
  const [language, setLanguage] = useState("twi")
  const [viewMode, setViewMode] = useState("grid") // 'grid' or 'list'

  // Fetch and parse hymns data from text file
  useEffect(() => {
    const fetchHymns = async () => {
      try {
        setLoading(true)
        const response = await fetch("./Hymns.txt")
        if (!response.ok) {
          throw new Error("Failed to fetch hymns")
        }
        const text = await response.text()
        const parsedHymns = parseHymnsText(text)
        setHymns(parsedHymns)
      } catch (err) {
        console.error("Error fetching hymns:", err)
        setError("Failed to load hymns. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchHymns()
  }, [])

  // Filter hymns based on search term
  const filterHymn = (hymn, lang) => {
    if (!searchTerm.trim()) return true

    const searchLower = searchTerm.toLowerCase()
    const title = (hymn[lang]?.title || "").toLowerCase()
    const content = [title, ...(hymn[lang]?.stanzas || []), hymn.chorus?.[lang] || ""].join(" ").toLowerCase()

    return content.includes(searchLower)
  }

  const filteredTwiHymns = hymns.filter((hymn) => filterHymn(hymn, "twi"))
  const filteredEnglishHymns = hymns.filter((hymn) => filterHymn(hymn, "english"))

  const handleHymnSelect = (hymn) => {
    setSelectedHymn(hymn)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #4caf50, #2e7d32)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 2s infinite",
          }}
        >
          <Music size={32} color="white" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ color: "white", margin: "0 0 0.5rem 0", fontSize: "1.25rem", fontWeight: "600" }}>
            Loading Hymnal
          </h3>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: 0, fontSize: "0.875rem" }}>
            Preparing your worship experience...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "16px",
          padding: "2rem",
          margin: "2rem auto",
          maxWidth: "500px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            background: "rgba(239, 68, 68, 0.2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <X size={24} color="#ef4444" />
        </div>
        <h3 style={{ color: "#ef4444", margin: "0 0 0.5rem 0", fontSize: "1.125rem", fontWeight: "600" }}>
          Unable to Load Hymns
        </h3>
        <p style={{ color: "rgba(255, 255, 255, 0.7)", margin: 0, fontSize: "0.875rem" }}>{error}</p>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #131a2d 0%, #1e293f 50%, #2d3748 100%)",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Enhanced Header */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "2rem",
            marginBottom: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={28} color="white" />
              </div>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "800",
                  margin: 0,
                  background: "linear-gradient(135deg, #4caf50, #81c784)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                COC Hymnal
              </h1>
            </div>
            <p
              style={{
                fontSize: "1.125rem",
                color: "rgba(255, 255, 255, 0.7)",
                margin: 0,
                maxWidth: "600px",
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: "1.6",
              }}
            >
              Discover and project beautiful hymns for worship in both Twi and English
            </p>
          </div>

          {/* Search and Controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              alignItems: "center",
            }}
          >
            {/* Search Bar */}
            <div style={{ position: "relative", width: "100%", maxWidth: "600px" }}>
              <Search
                size={20}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255, 255, 255, 0.5)",
                }}
              />
              <input
                type="text"
                placeholder="Search hymns by title, lyrics, or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "1rem 1rem 1rem 3rem",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "16px",
                  color: "white",
                  fontSize: "1rem",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4caf50"
                  e.target.style.boxShadow = "0 0 0 3px rgba(76, 175, 80, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.2)"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            {/* Controls Row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Language Toggle */}
              <div
                style={{
                  display: "flex",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "0.25rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <button
                  onClick={() => setLanguage("twi")}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "none",
                    background: language === "twi" ? "rgba(76, 175, 80, 0.3)" : "transparent",
                    color: language === "twi" ? "#4caf50" : "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  Twi
                </button>
                <button
                  onClick={() => setLanguage("english")}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "none",
                    background: language === "english" ? "rgba(76, 175, 80, 0.3)" : "transparent",
                    color: language === "english" ? "#4caf50" : "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  English
                </button>
              </div>

              {/* View Mode Toggle */}
              <div
                style={{
                  display: "flex",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "0.25rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "8px",
                    border: "none",
                    background: viewMode === "grid" ? "rgba(76, 175, 80, 0.3)" : "transparent",
                    color: viewMode === "grid" ? "#4caf50" : "rgba(255, 255, 255, 0.7)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "8px",
                    border: "none",
                    background: viewMode === "list" ? "rgba(76, 175, 80, 0.3)" : "transparent",
                    color: viewMode === "list" ? "#4caf50" : "rgba(255, 255, 255, 0.7)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hymns Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fit, minmax(350px, 1fr))" : "1fr",
            gap: "1.5rem",
          }}
        >
          {/* Combined Hymns Display */}
          <div style={{ gridColumn: viewMode === "list" ? "1" : "auto" }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                padding: "1.5rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "white",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "32px",
                      background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                      borderRadius: "4px",
                    }}
                  />
                  {language === "twi" ? "Twi Hymns" : "English Hymns"}
                </h2>
                <div
                  style={{
                    background: "rgba(76, 175, 80, 0.2)",
                    borderRadius: "12px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    color: "#4caf50",
                    fontWeight: "600",
                  }}
                >
                  {language === "twi" ? filteredTwiHymns.length : filteredEnglishHymns.length} hymns
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr",
                gap: "1rem",
              }}
            >
              {(language === "twi" ? filteredTwiHymns : filteredEnglishHymns).length > 0 ? (
                (language === "twi" ? filteredTwiHymns : filteredEnglishHymns).map((hymn) => (
                  <HymnCard
                    key={`${language}-${hymn.id}`}
                    hymn={hymn}
                    language={language}
                    onClick={() => handleHymnSelect(hymn)}
                    isSelected={selectedHymn?.id === hymn.id}
                    viewMode={viewMode}
                  />
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "4rem 2rem",
                   
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1rem",
                    }}
                  >
                    <Search size={32} color="rgba(255, 255, 255, 0.5)" />
                  </div>
                  <h3
                    style={{
                      color: "white",
                      margin: "0 0 0.5rem 0",
                      fontSize: "1.25rem",
                      fontWeight: "600",
                    }}
                  >
                    No hymns found
                  </h3>
                  <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: 0, fontSize: "0.875rem" }}>
                    Try adjusting your search terms or browse all hymns
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hymn Projection */}
      {selectedHymn && (
        <HymnProjection
          hymn={selectedHymn}
          onClose={() => setSelectedHymn(null)}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {/* Add animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .hymns-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(76, 175, 80, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(76, 175, 80, 0.7);
        }
      `}</style>
    </div>
  )
}

export default Hymns

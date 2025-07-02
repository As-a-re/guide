import React, { useState, useEffect } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

const TitleBar = ({ title }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial window state if available
    if (window.api && window.api.isMaximized) {
      window.api.isMaximized().then(maximized => {
        setIsMaximized(maximized);
      }).catch(() => {
        // Fail silently if the API isn't available
      });
    }

    // Listen for window state changes
    const handleMaximizeChange = (isMax) => setIsMaximized(isMax);
    
    if (window.api && window.api.onMaximizeChange) {
      window.api.onMaximizeChange(handleMaximizeChange);
    }

    return () => {
      if (window.api && window.api.offMaximizeChange) {
        window.api.offMaximizeChange(handleMaximizeChange);
      }
    };
  }, []);

  const handleMinimize = () => {
    if (window.api && window.api.minimizeApp) {
      window.api.minimizeApp();
    }
  };

  const handleMaximize = () => {
    if (window.api && window.api.maximizeApp) {
      window.api.maximizeApp();
    }
  };

  const handleClose = () => {
    if (window.api && window.api.closeApp) {
      window.api.closeApp();
    }
  };

  return (
    <div
      className="title-bar"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Window Title */}
      <div className="title">
        <span>{title || "Believers Guide"}</span>
      </div>

      {/* Window Controls */}
      <div className="controls">
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          className="control-button minimize"
          title="Minimize"
        >
          <Minus size={12} className="icon" style={{ opacity: isHovering ? 1 : 0 }} />
        </button>

        {/* Maximize Button */}
        <button
          onClick={handleMaximize}
          className="control-button maximize"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Minimize2 size={12} className="icon" style={{ opacity: isHovering ? 1 : 0 }} />
          ) : (
            <Maximize2 size={12} className="icon" style={{ opacity: isHovering ? 1 : 0 }} />
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="control-button close"
          title="Close"
        >
          <X size={12} className="icon" style={{ opacity: isHovering ? 1 : 0 }} />
        </button>
      </div>

      <style>{`
        .title-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 36px;
          background-color: #1a1f2e;
          color: #ffffff;
          user-select: none;
          -webkit-app-region: drag;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          border-bottom: 1px solid #2a324d;
          padding-right: 8px; /* Add some padding on the right */
        }

        .controls {
          display: flex;
          align-items: center;
          height: 100%;
          -webkit-app-region: no-drag;
          margin-left: auto; /* Push controls to the right */
          gap: 12px; /* Add space between buttons */
          padding: 0 8px; /* Add padding on sides */
        }

        .control-button {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          -webkit-app-region: no-drag;
          transition: background-color 0.2s;
          position: relative;
          padding: 0;
          border: none;
        }

        .control-button.close {
          background-color: #FF5F57;
        }

        .control-button.minimize {
          background-color: #FFBD2E;
        }

        .control-button.maximize {
          background-color: #28C940;
        }

        .control-button.close:hover {
          background-color: #FF4444;
        }

        .control-button.minimize:hover {
          background-color: #FFB11A;
        }

        .control-button.maximize:hover {
          background-color: #1DB93C;
        }

        .icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(0, 0, 0, 0.7);
          transition: opacity 0.2s;
        }

        .title {
          position: absolute;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          pointer-events: none; /* Prevent title from interfering with dragging */
          z-index: 1;
          margin: 0 100px; /* Ensure title doesn't overlap with controls */
        }
      `}</style>    
    </div>
  );
};

export default TitleBar;
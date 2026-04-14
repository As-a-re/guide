# Projection Integration Examples

## Adding Projection Button to Announcements

In your `Announcements.jsx` component:

```jsx
import React, { useState } from 'react';
import { Eye, Monitor } from 'lucide-react';
import { useProjection } from '../hooks/useProjection';

const AnnouncementsPage = () => {
  const { openProjection, closeProjection, hasSecondaryDisplay } = useProjection();
  const [projectedAnnouncementId, setProjectedAnnouncementId] = useState(null);
  
  // ... existing state and functions ...

  const handleProjectAnnouncement = (announcement) => {
    if (!hasSecondaryDisplay) {
      alert('No secondary display detected. Please connect an extended display.');
      return;
    }

    openProjection(announcement, 'announcement');
    setProjectedAnnouncementId(announcement.id);
  };

  // In your announcement item rendering:
  return (
    <div className="announcement-item">
      {/* ... existing announcement content ... */}
      
      <div className="announcement-actions">
        <button
          onClick={() => handleProjectAnnouncement(announcement)}
          disabled={!hasSecondaryDisplay}
          className="btn-project"
          title={hasSecondaryDisplay ? 'Project to display' : 'No secondary display'}
        >
          <Monitor size={18} />
          {projectedAnnouncementId === announcement.id ? 'Projecting...' : 'Project'}
        </button>
        
        {projectedAnnouncementId === announcement.id && (
          <button
            onClick={() => {
              closeProjection();
              setProjectedAnnouncementId(null);
            }}
            className="btn-stop-project"
          >
            Stop Projection
          </button>
        )}
      </div>
    </div>
  );
};
```

## Adding Projection to Scripture/Hymns

In your `Scripture.jsx`:

```jsx
import { useProjection } from '../hooks/useProjection';

const Scripture = () => {
  const { openProjection, hasSecondaryDisplay } = useProjection();
  const [currentVerse, setCurrentVerse] = useState(null);

  const handleProjectVerse = (verse, language = 'both') => {
    if (!hasSecondaryDisplay) {
      alert('No secondary display found');
      return;
    }

    const verseData = {
      title: `${verse.book} ${verse.chapter}:${verse.verse}`,
      text: verse.text,
      reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    };

    openProjection(verseData, 'verse');
    setCurrentVerse(verse);
  };

  return (
    <div>
      {/* ... verse display ... */}
      
      <button
        onClick={() => handleProjectVerse(currentVerse)}
        disabled={!hasSecondaryDisplay}
      >
        <Monitor size={18} /> Project Scripture
      </button>
    </div>
  );
};
```

## Adding Projection to Hymns

In your `Hymns.jsx`:

```jsx
import { useProjection } from '../hooks/useProjection';

const Hymns = () => {
  const { openProjection, updateProjection, hasSecondaryDisplay, isProjectionActive } = useProjection();

  const handleProjectHymn = (hymn, stanza = null) => {
    if (!hasSecondaryDisplay) {
      alert('No secondary display detected');
      return;
    }

    const hymnData = {
      title: `Hymn ${hymn.number} - ${hymn[selectedLanguage].title}`,
      lyrics: stanza 
        ? hymn[selectedLanguage].stanzas[stanza]
        : hymn[selectedLanguage].stanzas.join('\n\n'),
      number: hymn.number,
    };

    if (isProjectionActive) {
      // Update existing projection
      updateProjection(hymnData);
    } else {
      // Create new projection
      openProjection(hymnData, 'hymn');
    }
  };

  return (
    <div>
      {/* Hymn display */}
      <button
        onClick={() => handleProjectHymn(hymn)}
        disabled={!hasSecondaryDisplay}
        className={isProjectionActive ? 'projecting' : ''}
      >
        <Monitor size={18} />
        {isProjectionActive ? 'Update Projection' : 'Project Hymn'}
      </button>
    </div>
  );
};
```

## Complete Announcements Component with Projection

```jsx
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Monitor, X } from 'lucide-react';
import { useProjection } from '../hooks/useProjection';
import './Announcements.css';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const { openProjection, closeProjection, hasSecondaryDisplay, isProjectionActive } = useProjection();
  const [projectedId, setProjectedId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('churchAnnouncements');
    if (saved) setAnnouncements(JSON.parse(saved));
  }, []);

  const handleProject = (announcement) => {
    if (!hasSecondaryDisplay) {
      alert('Connect a secondary display via Win+P > Extend');
      return;
    }

    if (isProjectionActive && projectedId === announcement.id) {
      closeProjection();
      setProjectedId(null);
    } else {
      openProjection(announcement, 'announcement');
      setProjectedId(announcement.id);
    }
  };

  return (
    <div className="announcements-container">
      <div className="announcements-list">
        {announcements.map(announcement => (
          <div key={announcement.id} className="announcement-card">
            <div className="announcement-header">
              <h3>{announcement.title}</h3>
              <span className={`priority priority-${announcement.priority}`}>
                {announcement.priority}
              </span>
            </div>

            <p className="announcement-content">{announcement.content}</p>

            <div className="announcement-footer">
              <small>{new Date(announcement.date).toLocaleDateString()}</small>
              
              <div className="announcement-actions">
                <button
                  onClick={() => handleProject(announcement)}
                  disabled={!hasSecondaryDisplay}
                  className={`btn-project ${
                    projectedId === announcement.id ? 'active' : ''
                  }`}
                >
                  <Monitor size={18} />
                  {projectedId === announcement.id ? 'Stop' : 'Project'}
                </button>

                <button className="btn-edit">
                  <Pencil size={18} />
                </button>

                <button className="btn-delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!hasSecondaryDisplay && (
        <div className="no-display-warning">
          <Monitor size={32} />
          <p>No secondary display detected</p>
          <small>Connect a projector or extend your display: Win+P > Extend</small>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
```

## CSS for Projection Button

Add to your component CSS:

```css
.btn-project {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-project:hover:not(:disabled) {
  background: #0052a3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
}

.btn-project:disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-project.active {
  background: #ff6b35;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(255, 107, 53, 0); }
}

.no-display-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #888;
  text-align: center;
}

.no-display-warning small {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #aaa;
}
```

## Testing the Integration

1. **Single Display Setup**: App should disable projection buttons and show warning
2. **Extended Display Setup** (Win+P > Extend):
   - Click "Project" button
   - New window should appear on secondary display
   - Should show content full-screen
   - ESC key should close projection
3. **Live Updates**: 
   - Change content while projecting
   - Click "Update Projection" or similar
   - Content should update in real-time

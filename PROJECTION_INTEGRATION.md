# Secondary Display Projection Integration Guide

This guide explains how to use secondary display projection in your Electron app with extended displays.

## Architecture Overview

The projection system uses:
- **Main Process** (`main.js`) - Detects displays and manages projection window
- **Preload Bridge** (`preload.cjs`) - Exposes safe IPC APIs to React components
- **Projection Page** (`ProjectionPage.jsx`) - Full-screen display shown on secondary monitor
- **useProjection Hook** (`hooks/useProjection.js`) - React hook for component integration

## How Extended Display Detection Works

When the app starts with extended displays:
1. Main process detects all connected displays via `screen.getAllDisplays()`
2. Primary display = main app window
3. Secondary display = projection target (if available)
4. When projection opens, a new Electron window is created at secondary display bounds

## Using Projection in Components

### Basic Example - Announcements

```jsx
import { useProjection } from '../hooks/useProjection';

const AnnouncementsPage = () => {
  const { openProjection, closeProjection, hasSecondaryDisplay } = useProjection();

  const handleProjectAnnouncement = (announcement) => {
    if (hasSecondaryDisplay) {
      // Open on secondary display
      openProjection(announcement, 'announcement');
    } else {
      alert('No secondary display detected');
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleProjectAnnouncement(someAnnouncement)}
        disabled={!hasSecondaryDisplay}
      >
        Project to Display
      </button>
    </div>
  );
};
```

### Scripture/Verse Projection

```jsx
const handleProjectScripture = (verse) => {
  if (hasSecondaryDisplay) {
    openProjection({
      title: `${verse.book} ${verse.chapter}:${verse.verse}`,
      text: verse.text,
      reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
      backgroundDesignId: selectedDesign // optional
    }, 'verse');
  }
};
```

### Hymn Projection

```jsx
const handleProjectHymn = (hymn) => {
  if (hasSecondaryDisplay) {
    openProjection({
      title: hymn.title,
      lyrics: hymn.lyrics,
      number: hymn.number
    }, 'hymn');
  }
};
```

## Data Format by Type

### Announcement
```javascript
{
  title: string,
  content: string,
  priority?: 'low' | 'medium' | 'high',
  date?: string,
  backgroundDesignId?: string
}
```

### Verse/Scripture
```javascript
{
  title: string,
  text: string,
  reference: string,
  backgroundDesignId?: string
}
```

### Hymn
```javascript
{
  title: string,
  lyrics: string,
  number?: number
}
```

## Advanced Usage

### Update Projection Content
```jsx
const { updateProjection } = useProjection();

// Update content while projection is active
updateProjection({
  title: 'Updated Title',
  content: 'New content...'
});
```

### Check Display Availability
```jsx
const { availableDisplays, hasSecondaryDisplay } = useProjection();

// Check if secondary display exists
if (hasSecondaryDisplay) {
  console.log('Secondary display available');
  console.log('Displays:', availableDisplays);
}
```

### Monitor Projection Status
```jsx
const { isProjectionActive, closeProjection } = useProjection();

useEffect(() => {
  if (isProjectionActive) {
    console.log('Projection is currently active');
  }
}, [isProjectionActive]);
```

## Integration Checklist

- [ ] main.js has secondary display detection (already implemented)
- [ ] preload.cjs exposes projection APIs (already implemented)
- [ ] ProjectionPage.jsx handles all content types (already implemented)
- [ ] Component imports and uses useProjection hook
- [ ] Button/control has secondary display check
- [ ] Data format matches expected type structure
- [ ] Test with extended display (Win+P > Extend)

## File Locations

- Electron Main: `/main.js`
- Preload Bridge: `/preload.cjs`
- Projection Page: `/src/ProjectionPage.jsx`
- Projection Hook: `/src/hooks/useProjection.js`
- Projection Styles: `/src/components/ProjectionView.css`

## Debugging

Check the Electron console logs for projection status:
```
[Projection] Available displays: 2
[Projection] Display 0: 1920x1080 at (0, 0) - Primary: true
[Projection] Display 1: 1920x1080 at (1920, 0) - Primary: false
[Projection] Using secondary display
[Projection] Creating window at (1920, 0) with size 1920x1080
```

## Common Issues

### Projection Window Appears on Primary Display
- Check that secondary display is properly detected
- Verify display bounds in DevTools console

### Content Not Updating
- Ensure data structure matches expected format
- Check browser console for errors
- Verify IPC communication isn't being blocked

### Window Appears but Content is Black
- Check that route `/projection` is properly configured
- Verify ProjectionPage component is rendering
- Check for console errors in DevTools

# Secondary Display Projection - Setup & Implementation

## What's Been Implemented

Your application now has fully functional secondary display projection support. Here's what's ready to use:

### ✅ Core Components
- **main.js** - Electron main process with secondary display detection
- **preload.cjs** - Secure IPC bridge for React-Electron communication
- **ProjectionPage.jsx** - Full-screen projection renderer
- **useProjection.js** - React hook for easy component integration

### ✅ Features
- Auto-detect primary and secondary displays
- Open projections on secondary display only (extended mode)
- Support for multiple content types (announcements, scripture, hymns)
- Live content updates while projecting
- Font size and text color controls
- ESC key to close projection
- Automatic window positioning on secondary monitor

## Quick Start

### 1. Basic Implementation in Any Component

```jsx
import { useProjection } from './hooks/useProjection';

function MyComponent() {
  const { openProjection, hasSecondaryDisplay } = useProjection();

  const handleProject = () => {
    if (!hasSecondaryDisplay) {
      alert('Please connect a secondary display');
      return;
    }

    openProjection({
      title: 'My Content',
      content: 'Content to display'
    }, 'announcement');
  };

  return (
    <button 
      onClick={handleProject}
      disabled={!hasSecondaryDisplay}
    >
      Project to Display
    </button>
  );
}
```

### 2. Test on Windows

Using Windows display settings:
1. Connect projector or second monitor
2. Right-click desktop → Display settings
3. Choose "Extend" (not duplicate)
4. Windows will show primary (your app) and secondary (projector)

Or use Win+P shortcut:
- Win+P → PC screen only (single display)
- Win+P → Extend (two displays - ready for projection)
- Win+P → Duplicate (not recommended - windows don't position correctly)

### 3. Integration Into Your Components

#### For Announcements
```jsx
const handleProjectAnnouncement = (announcement) => {
  if (hasSecondaryDisplay) {
    openProjection(announcement, 'announcement');
  }
};
```

#### For Scripture
```jsx
const handleProjectScripture = (verse) => {
  if (hasSecondaryDisplay) {
    openProjection({
      title: `${verse.book} ${verse.chapter}:${verse.verse}`,
      text: verse.text,
      reference: verse.reference
    }, 'verse');
  }
};
```

#### For Hymns
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

## File Structure

```
project-root/
├── main.js                          ← Electron main process (updated)
├── preload.cjs                      ← IPC bridge (updated)
├── src/
│   ├── ProjectionPage.jsx           ← Projection renderer (updated)
│   ├── hooks/
│   │   └── useProjection.js         ← React hook (new)
│   ├── Announcements.jsx            ← Ready to integrate
│   ├── Scripture.jsx                ← Ready to integrate
│   ├── Hymns.jsx                    ← Ready to integrate
│   └── components/
│       └── ProjectionView.css       ← Styling for projections
└── PROJECTION_INTEGRATION.md        ← Full documentation
```

## API Reference

### useProjection Hook

```javascript
const {
  openProjection,        // (data, type) => void
  closeProjection,       // () => void
  updateProjection,      // (data) => void
  isProjectionActive,    // boolean
  availableDisplays,     // Display[]
  hasSecondaryDisplay    // boolean
} = useProjection();
```

### Content Type Specifications

**announcement**
```javascript
{
  title: string,
  content: string,
  priority?: 'low' | 'medium' | 'high',
  date?: string,
  backgroundDesignId?: string
}
```

**verse**
```javascript
{
  title: string,
  text: string,
  reference: string,
  backgroundDesignId?: string
}
```

**hymn**
```javascript
{
  title: string,
  lyrics: string,
  number?: number
}
```

## How Display Detection Works

1. **Electron Main Process** detects all connected displays:
   ```
   Display 0: 1920x1080 at (0, 0) - Primary ✓
   Display 1: 1920x1080 at (1920, 0) - Secondary (Projector)
   ```

2. **Primary display** runs the main app window
3. **Secondary display** opens projection window automatically
4. **Window coordinates** are set to secondary display bounds
5. Result: Projection window appears on projector, not on your main monitor

## Testing Checklist

- [ ] Single monitor: Buttons disabled, warning shown
- [ ] Extended display: Buttons enabled
- [ ] Click project: Window opens on secondary display
- [ ] Correct content: Title and content visible
- [ ] Font controls: +/- keys work
- [ ] Color picker: Can change text color
- [ ] ESC key: Closes projection
- [ ] Live update: Can update content while projecting
- [ ] Background: Design/color applied correctly

## Troubleshooting

### Projection Opens on Wrong Monitor
Check display bounds in DevTools console:
```javascript
window.api.getProjectionDisplays().then(displays => {
  console.table(displays);
});
```
Ensure secondary display bounds are correct (x > 0 usually)

### Blank White/Black Window
1. Check ProjectionPage route is registered in router
2. Check ProjectionView.css is imported
3. Verify content is being sent via IPC
4. Check browser console for errors

### Button Stays Disabled
1. Verify secondary display is connected and in "Extend" mode
2. Check `hasSecondaryDisplay` value in console
3. Try refreshing the app

### Content Not Updating
1. Verify data format matches expected type
2. Check updateProjection is being called
3. Verify IPC isn't blocked by security settings

## Next Steps

1. **Review** the example implementations in `EXAMPLES_PROJECTION.md`
2. **Choose** your components (Announcements, Scripture, Hymns, etc.)
3. **Import** the `useProjection` hook
4. **Add** projection button next to your content
5. **Test** with extended display
6. **Customize** styling and layouts as needed

## Performance Notes

- Projection window runs in separate process - doesn't affect main app performance
- Content updates are instant via IPC messaging
- Multiple rapid updates are batched automatically
- Window creation takes ~500ms on first use (normal Electron behavior)

## Security

- Electron context isolation enabled
- Node integration disabled
- Preload script whitelist approach
- Safe IPC data passing
- DevTools disabled in production

## Support Files

- `PROJECTION_INTEGRATION.md` - Detailed integration guide
- `EXAMPLES_PROJECTION.md` - Code examples for each component
- `src/hooks/useProjection.js` - React hook source
- `ProjectionPage.jsx` - Full projection renderer

All files are properly typed and documented for easy customization.

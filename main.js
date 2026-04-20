// main.js
import { app, BrowserWindow, Menu, protocol, ipcMain, screen } from "electron";
import path, { join } from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global reference to projection window
let projectionWindow = null;

/* ---------------------------------------------------------
   FIXED FILE PROTOCOL (No CORS issues)
--------------------------------------------------------- */
function registerBuildProtocol() {
  protocol.interceptFileProtocol("file", (request, callback) => {
    let url = request.url.replace("file:///", "").replace("file://", "");
    url = decodeURIComponent(url);

    console.log("Protocol intercepted - Original URL:", request.url);
    console.log("Protocol intercepted - Decoded path:", url);

    // The URL already contains the full path, just normalize it
    const resolved = path.normalize(url);

    console.log("Protocol intercepted - Serving:", resolved);

    callback({ path: resolved });
  });
}

/* ---------------------------------------------------------
   CREATE MAIN WINDOW
--------------------------------------------------------- */
function createMainWindow() {
  const win = new BrowserWindow({
    title: "Believers Guide",
    width: 1500,
    height: 800,
    frame: false,
    icon: join(__dirname, "e.ico"),

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true, // Temporarily enable for debugging
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    // React dev server
    win.loadURL("http://localhost:3000/");
    // DevTools disabled for cleaner first-time experience
    // win.webContents.openDevTools();
  } else {
    // React production build
    // In production, files are in resources/app.asar or resources/app
    const indexPath = path.join(__dirname, "my-app", "build", "index.html");
    
    console.log("Looking for index.html at:", indexPath);
    console.log("__dirname:", __dirname);
    console.log("File exists:", fs.existsSync(indexPath));
    
    // Open DevTools to see debug output
    // win.webContents.openDevTools();

    if (fs.existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      win.loadURL(
        `data:text/html,<h2>Build not found at: ${indexPath}<br>__dirname: ${__dirname}</h2>`
      );
    }
  }

  // IPC window control
  ipcMain.on("minimizeApp", () => win.minimize());
  ipcMain.on("maximizeApp", () =>
    win.isMaximized() ? win.unmaximize() : win.maximize()
  );
  ipcMain.on("closeApp", () => win.close());

  return win;
}

/* ---------------------------------------------------------
   CREATE PROJECTION WINDOW (on extended/secondary display)
--------------------------------------------------------- */
function createProjectionWindow(data, type = 'announcement') {
  // Close existing projection window if any
  if (projectionWindow) {
    projectionWindow.close();
    projectionWindow = null;
  }

  // Get all displays
  const displays = screen.getAllDisplays();
  
  console.log(`[Projection] Available displays: ${displays.length}`);
  displays.forEach((display, index) => {
    console.log(`[Projection] Display ${index}: ${display.bounds.width}x${display.bounds.height} at (${display.bounds.x}, ${display.bounds.y}) - Primary: ${display.primary}`);
  });
  
  // Find secondary display (non-primary) or use primary if only one exists
  let projectionDisplay = displays.find(d => !d.primary);
  if (!projectionDisplay) {
    projectionDisplay = displays[0]; // Fallback to primary if no secondary found
    console.log('[Projection] No secondary display found, using primary display');
  } else {
    console.log('[Projection] Using secondary display');
  }

  const { x, y, width, height } = projectionDisplay.bounds;
  console.log(`[Projection] Creating window at (${x}, ${y}) with size ${width}x${height}`);

  projectionWindow = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    frame: false,
    fullscreen: false,
    show: false, // Don't show immediately, wait for content to load
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  });

  // Load projection content
  const loadHandler = () => {
    console.log(`[Projection] Sending ${type} data to projection window`);
    projectionWindow.webContents.send('projection-data', data, type);
    projectionWindow.show(); // Show after content is loaded
  };

  // Determine route based on content type
  const projectionRoute = type === 'scripture' ? '#/scripture-projection' : '#/projection';
  
  if (isDev) {
    projectionWindow.loadURL(`http://localhost:3000/${projectionRoute}`);
    projectionWindow.webContents.on('did-finish-load', loadHandler);
  } else {
    const indexPath = path.join(__dirname, "my-app", "build", "index.html");
    if (fs.existsSync(indexPath)) {
      projectionWindow.loadFile(indexPath);
      projectionWindow.webContents.on('did-finish-load', () => {
        // Navigate to projection route after page loads
        projectionWindow.webContents.executeJavaScript(`window.location.hash = '${projectionRoute}'`);
        // Send data with a small delay to ensure route is loaded
        setTimeout(() => {
          loadHandler();
        }, 500);
      });
    }
  }

  // Clean up reference when window is closed
  projectionWindow.on('closed', () => {
    console.log('[Projection] Projection window closed');
    projectionWindow = null;
  });

  // Handle escape key in projection window to close it
  projectionWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key.toLowerCase() === 'escape') {
      event.preventDefault();
      if (projectionWindow) {
        projectionWindow.close();
        projectionWindow = null;
      }
    }
  });

  return projectionWindow;
}

/* ---------------------------------------------------------
   IPC HANDLERS FOR PROJECTION
--------------------------------------------------------- */
ipcMain.on('open-projection', (event, data, type = 'announcement') => {
  console.log(`[IPC] Opening projection with type: ${type}`);
  createProjectionWindow(data, type);
});

ipcMain.on('update-projection', (event, data) => {
  if (projectionWindow && !projectionWindow.isDestroyed()) {
    console.log('[IPC] Updating projection data');
    projectionWindow.webContents.send('projection-data-update', data);
  }
});

ipcMain.on('close-projection', () => {
  console.log('[IPC] Closing projection window');
  if (projectionWindow) {
    projectionWindow.close();
    projectionWindow = null;
  }
});

ipcMain.handle('get-projection-displays', () => {
  const displays = screen.getAllDisplays();
  return displays.map(d => ({
    id: d.id,
    name: `Display ${d.id}`,
    primary: d.primary,
    bounds: d.bounds,
    size: `${d.bounds.width}x${d.bounds.height}`
  }));
});

ipcMain.handle('get-projection-status', () => {
  return {
    isActive: projectionWindow && !projectionWindow.isDestroyed(),
    windowId: projectionWindow ? projectionWindow.id : null
  };
});

// Scripture-specific IPC handlers - forward to main window
ipcMain.on('projection-navigate', (event, direction) => {
  console.log(`[IPC] Scripture navigation: ${direction}`);
  // Forward navigation command to main window
  const mainWindow = BrowserWindow.getAllWindows().find(w => w !== projectionWindow);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('scripture-navigate', direction);
  }
});

ipcMain.on('projection-language-change', (event, language) => {
  console.log(`[IPC] Scripture language change: ${language}`);
  // Forward language change command to main window
  const mainWindow = BrowserWindow.getAllWindows().find(w => w !== projectionWindow);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('scripture-language-change', language);
  }
});

/* ---------------------------------------------------------
   APP READY
--------------------------------------------------------- */
app.whenReady().then(() => {
  if (!isDev) registerBuildProtocol();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

/* ---------------------------------------------------------
   QUIT APP
--------------------------------------------------------- */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

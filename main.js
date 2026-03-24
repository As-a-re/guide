// main.js
import { app, BrowserWindow, Menu, protocol, ipcMain } from "electron";
import path, { join } from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

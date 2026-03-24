// preload.js (CommonJS)
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimizeApp: () => ipcRenderer.send('minimizeApp'),
  maximizeApp: () => ipcRenderer.send('maximizeApp'),
  closeApp: () => ipcRenderer.send('closeApp'),
});
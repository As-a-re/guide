// preload.js (CommonJS)
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimizeApp: () => ipcRenderer.send('minimizeApp'),
  maximizeApp: () => ipcRenderer.send('maximizeApp'),
  closeApp: () => ipcRenderer.send('closeApp'),
  
  // Projection control
  openProjection: (data, type = 'announcement') => ipcRenderer.send('open-projection', data, type),
  updateProjection: (data) => ipcRenderer.send('update-projection', data),
  closeProjection: () => ipcRenderer.send('close-projection'),
  
  // Projection data listeners
  onProjectionData: (callback) => ipcRenderer.on('projection-data', (event, data, type) => callback(data, type)),
  onProjectionDataUpdate: (callback) => ipcRenderer.on('projection-data-update', (event, data) => callback(data)),
  removeProjectionDataListener: () => ipcRenderer.removeAllListeners('projection-data'),
  
  // Projection status
  getProjectionDisplays: () => ipcRenderer.invoke('get-projection-displays'),
  getProjectionStatus: () => ipcRenderer.invoke('get-projection-status'),
  
  // Generic send function for IPC messages
  send: (channel, data) => {
    const validChannels = ['projection-navigate', 'projection-language-change'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Scripture navigation listeners (for main window to receive commands from projection window)
  onScriptureNavigate: (callback) => ipcRenderer.on('scripture-navigate', (event, direction) => callback(direction)),
  onScriptureLanguageChange: (callback) => ipcRenderer.on('scripture-language-change', (event, language) => callback(language)),
  removeScriptureListeners: () => {
    ipcRenderer.removeAllListeners('scripture-navigate');
    ipcRenderer.removeAllListeners('scripture-language-change');
  },
});

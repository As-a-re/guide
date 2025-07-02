import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import { join } from 'path';
import path from  "path"
import { fileURLToPath } from 'url';  
 
function createMainWindow() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const mainWindow = new BrowserWindow({
        title: 'Believers Guide',
        frame:false,
        width: 1500,
        height: 800,
        icon: join(__dirname, './e.ico'),
        webPreferences:{
          nodeIntegration:true,
          contextIsolation:true,  
          preload: path.join(__dirname ,"./preload.cjs") 
        }
    }); 

    Menu.setApplicationMenu(null);

    mainWindow.loadURL('http://localhost:3000/'); 
    mainWindow.maximize();

    if (process.platform !== 'darwin') { 
      mainWindow.webContents.openDevTools();
  }

    ipcMain.on("minimizeApp", () => {
      mainWindow?.minimize();
    });
    ipcMain.on("maximizeApp", () => {
      if (mainWindow?.isMaximized()) {
        mainWindow?.unmaximize();
      } else {
        mainWindow?.maximize();
      }
    });
    ipcMain.on("closeApp", () => {
      mainWindow?.close();
    });
}



app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

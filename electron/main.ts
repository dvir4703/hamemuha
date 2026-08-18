import { join } from 'node:path';

import { app, BrowserWindow } from 'electron';

import { databaseConnection } from './database/connection';
import { registerIpcHandlers } from './ipc/handlers';
import {
  registerImageProtocol,
  registerImageScheme,
} from './services/file.service';

registerImageScheme();

let mainWindow: BrowserWindow | null = null;

function getRuntimeIconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'app-icon.png')
    : join(__dirname, '../resources/app-icon.png');
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    icon: getRuntimeIconPath(),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../dist-renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

void app.whenReady().then(() => {
  databaseConnection.getConnection();
  registerImageProtocol();
  registerIpcHandlers();
  app.dock?.setIcon(getRuntimeIconPath());
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  databaseConnection.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

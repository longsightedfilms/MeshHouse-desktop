declare const __dirname: string;

import path from 'path';
import {
  app,
  protocol,
  ipcMain,
} from 'electron';
import { BrowserWindow } from 'electron-acrylic-window';
import type { VibrancyOptions } from 'electron-acrylic-window';
import { autoUpdater } from 'electron-updater';

import { getVibrancyOptions } from './functions/theme';
import { isWindows10, getIconForOS } from './functions/os';
import * as ApplicationStore from './electron-store';
import * as ipcHandlers from './ipc_handlers';
import { createWindow, generateUserAgent } from './createwindow';
import { handleTray } from './tray';

const isDevelopment = process.env.NODE_ENV !== 'production';

const applicationOptions: any = {
  width: ApplicationStore.settings.get('applicationWindow.width') || 1024,
  height: ApplicationStore.settings.get('applicationWindow.height') || 768,
  minWidth: 1024,
  minHeight: 700,
  icon: getIconForOS(),
  frame: process.platform === 'win32' ? false : true,
  show: false,
  resizable: true,
  webPreferences: {
    enableRemoteModule: true,
    contextIsolation: false,
    experimentalFeatures: true,
    nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
    webSecurity: false,
    webviewTag: true,
    //preload: path.join(__dirname, 'preload.js')
  },
};

const theme = ApplicationStore.settings.get('theme') || 'light';

const vibrancyOptions: VibrancyOptions = getVibrancyOptions(theme);

if (isWindows10()) {
  applicationOptions.vibrancy = vibrancyOptions;
}

export let appWin: BrowserWindow | null = null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

app.whenReady().then(() => {
  protocol.registerFileProtocol('local', (request, callback) => {
    const pathname = decodeURI(request.url.replace(/local:\/\/\/|\?.+/gm, ''));
    callback(pathname);
  });

  const agent = generateUserAgent(appWin?.webContents.getUserAgent() ?? '');
  appWin?.webContents.setUserAgent(agent);
  console.log(appWin?.webContents.getUserAgent());

  if (ApplicationStore.settings.get('showInTray')) {
    handleTray(appWin);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (appWin === null) {
    appWin = createWindow('app', 'index.html', applicationOptions);
  }
});

app.on('ready', () => {
  if(ApplicationStore.settings.get('checkForUpdatesOnStartup') === true) {
    autoUpdater.checkForUpdates();
  }
  appWin = createWindow('app', 'index.html', applicationOptions);
});

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

// Handling auto updates
if (isDevelopment) {
  autoUpdater.updateConfigPath = path.join(__dirname, '../', 'dev-app-update.yml');
}

autoUpdater.autoDownload = false;
autoUpdater.allowPrerelease = true;

autoUpdater.on('update-available', (info) => {
  appWin?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  appWin?.webContents.send('update-not-available');
});

autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
  appWin?.webContents.send('download-progress', progressObj);
});

ipcMain.on('check-update', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcHandlers.imageHandler();
ipcHandlers.integrationsHandler();
ipcHandlers.fsHandler();
ipcHandlers.themeHandler();
ipcHandlers.shellHandler();
ipcHandlers.storeHandler();
ipcHandlers.systemInfoHandler();

ApplicationStore.initAppSettings();
ApplicationStore.initDCCSettings();

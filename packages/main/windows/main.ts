import { BrowserWindow, screen, shell, app } from 'electron';
import { join } from 'path';
import { checkAndApplyDevicePrivilege } from '../services/device';
import { initWhiteboardWindow } from './whiteboard';
import { initAnnotationWindow } from './annotation';
import { paths } from '../config/paths';
import {setupAutoUpdater} from '../services/updater';

let mainWindow: BrowserWindow | null = null;
let schemeRoomId = '';

export function setSchemeRoomId(roomId: string) {
  schemeRoomId = roomId;
}

export async function setupMainWindow() {
  const { isHasScreen } = await checkAndApplyDevicePrivilege();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  console.log('preloadPath:', paths.preload); // 添加日志便于调试

  mainWindow = new BrowserWindow({
    title: 'Main window',
    width,
    height,
    minWidth: 1200,
    minHeight: 640,
    webPreferences: {
      preload: paths.preload.entry,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 初始化自动更新
  setupAutoUpdater(mainWindow);

  mainWindow.on('close', () => {
    mainWindow = null;
  });

  await loadMainWindow();
  setupWindowEvents(isHasScreen);

  initWhiteboardWindow(mainWindow);
  initAnnotationWindow(mainWindow);

  return mainWindow;
}

async function loadMainWindow() {
  console.log('process.env.NODE_ENV', process.env.NODE_ENV);
  if (['development','mock'].includes(process.env.NODE_ENV)) {
    // 开发环境
    await installDevTools();
    await mainWindow?.loadURL(paths.devServer);
    mainWindow?.webContents.openDevTools(); // 开发环境下默认打开开发者工具
  } else {
    // 生产环境
    if (schemeRoomId) {
      await mainWindow?.loadFile(paths.renderer.entry, {
        hash: `home?roomId=${schemeRoomId}`,
      });
    } else {
      await mainWindow?.loadFile(paths.renderer.entry);
    }
  }
}

function setupWindowEvents(isHasScreen: boolean) {
  mainWindow?.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', { isHasScreen });
  });

  mainWindow?.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function installDevTools() {
  try {
    const installExtension = require('electron-devtools-installer');
    await installExtension.default(installExtension.VUEJS_DEVTOOLS);
  } catch (err) {
    console.log('Unable to install vue-devtools:', err);
  }
}

export function getMainWindow() {
  return mainWindow;
}

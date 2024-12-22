import { app, BrowserWindow, shell, ipcMain, screen } from 'electron';
import { join } from 'path';
import { paths } from '../config/paths';

let mainWin: BrowserWindow | null = null;
let annotationWin: BrowserWindow | null = null;

const SCREEN_POSITION_OFFSET = 100;
/**
 * 初始化标注窗口
 * @param win 主窗口实例
 */
export function initAnnotationWindow(win: BrowserWindow) {
  mainWin = win;
  createAnnotationWindow();
  loadAnnotationFile();
  monitoringAnnotationWindowEvents();
  monitoringMainWindowEvents();
  monitoringIpcEvents();
}

/**
 * 创建标注窗口
 * 配置窗口属性：透明、无框架、始终置顶等
 */
export function createAnnotationWindow() {
  const win = new BrowserWindow({
    title: 'Annotation window',
    transparent: true,
    show: false,
    frame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    minimizable: false,
    resizable: false,
    webPreferences: {
      preload: paths.preload.entry,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (['development', 'mock'].includes(process.env.NODE_ENV)) {
    win.loadURL(paths.devServer);
  } else {
    win.loadFile(paths.renderer.entry);
  }

  annotationWin = win;
}

/**
 * 加载标注窗口的页面内容
 * 根据环境（开发/生产）加载不同的页面源
 */
function loadAnnotationFile() {
  if (app.isPackaged) {
    annotationWin?.loadFile(join(__dirname, `../../renderer/index.html`), {
      hash: `whiteboard?isAnnotationWin=true`,
    });
  } else {
    const url = `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_SERVER_PORT}`;
    const annotationUrl = `${url}#/whiteboard?isAnnotationWin=true`;
    annotationWin?.loadURL(annotationUrl);
  }

  annotationWin?.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * 监听标注窗口事件
 * 处理窗口关闭逻辑
 */
function monitoringAnnotationWindowEvents() {
  annotationWin?.on('close', event => {
    if (mainWin !== null) {
      event.preventDefault();
    } else {
      annotationWin = null;
    }
  });
}

/**
 * 监听主窗口事件
 * 处理应用退出和主窗口关闭的情况
 */
function monitoringMainWindowEvents() {
  app.on('window-all-closed', () => {
    mainWin = null;
    annotationWin = null;
  });

  mainWin?.on('close', () => {
    mainWin = null;
    if (annotationWin) {
      annotationWin.close();
      annotationWin = null;
    }
  });
}

/**
 * 监听 IPC 事件
 * 处理标注功能相关的所有进程间通信
 */
function monitoringIpcEvents() {
  ipcMain.on('app-exit', () => {
    annotationWin?.close();
    annotationWin = null;
  });

  ipcMain.on('annotation:start-annotating', () => {
    if (mainWin) {
      mainWin.minimize();
    }
    if (annotationWin) {
      annotationWin.setIgnoreMouseEvents(false);
      annotationWin.webContents.send('annotation:annotating-started');
      annotationWin.show();
    }
  });

  ipcMain.on('annotation:stop-annotating', () => {
    if (annotationWin) {
      annotationWin.setIgnoreMouseEvents(true);
      annotationWin.webContents.send('annotation:annotating-stopped');
    }
    if (mainWin) {
      mainWin.show();
    }
  });

  ipcMain.on('annotation:stop-from-annotation-window', () => {
    if (annotationWin) {
      annotationWin.setIgnoreMouseEvents(true);
      annotationWin.webContents.send('annotation:annotating-stopped');
    }
    if (mainWin) {
      mainWin.webContents.send('annotation:stop-from-annotation-window');
      mainWin.show();
    }
  });

  ipcMain.on('annotation:screen-share-started', (event, params: { x: number; y: number }) => {
    const { screenX, screenY } = calculateScreenPosition(params.x, params.y);
    let selectedScreen: Electron.Display | undefined;
    
    screen.getAllDisplays().forEach(item => {
      if (
        Math.abs(screenX - item.workArea.x * item.scaleFactor) < SCREEN_POSITION_OFFSET &&
        Math.abs(screenY - item.workArea.y * item.scaleFactor) < SCREEN_POSITION_OFFSET
      ) {
        selectedScreen = item;
      }
    });

    if (annotationWin && selectedScreen) {
      annotationWin.setSize(100, 100);
      annotationWin.setPosition(
        selectedScreen.workArea.x,
        selectedScreen.workArea.y
      );
      const windowWidth = selectedScreen.workArea.width;
      const windowHeight = selectedScreen.workArea.height;
      annotationWin.setSize(windowWidth, windowHeight);
      annotationWin.setIgnoreMouseEvents(true);
      annotationWin.show();
    }
  });

  ipcMain.on('annotation:screen-share-stopped', () => {
    if (annotationWin) {
      annotationWin.setIgnoreMouseEvents(true);
      annotationWin.webContents.send('annotation:annotating-stopped');
      annotationWin.webContents.send('annotation:clear');
      annotationWin.hide();
    }
  });

  ipcMain.on('annotation:hide', () => {
    if (annotationWin) {
      annotationWin.webContents.send('annotation:annotating-stopped');
      annotationWin.webContents.send('annotation:clear');
      annotationWin.hide();
    }
  });
}

/**
 * 计算屏幕实际位置
 * 处理大于 32 位无符号整数的情况
 * @param screenPositionX X 坐标
 * @param screenPositionY Y 坐标
 * @returns 处理后的屏幕坐标
 */
function calculateScreenPosition(
  screenPositionX: number,
  screenPositionY: number
) {
  const maxUInt32 = 4294967296;
  const checkSize = 4000000000;
  if (screenPositionX > checkSize) {
    screenPositionX -= maxUInt32;
  }
  if (screenPositionY > checkSize) {
    screenPositionY -= maxUInt32;
  }

  return {
    screenX: screenPositionX,
    screenY: screenPositionY,
  };
}

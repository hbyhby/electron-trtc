import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'path';
import { paths } from '../config/paths';

// 存储主窗口和白板窗口的引用
let mainWin: BrowserWindow | null = null;
let whiteboardWin: BrowserWindow | null = null;

// 白板窗口的默认尺寸
const WHITEBOARD_WINDOW_WIDTH = 1280;
const WHITEBOARD_WINDOW_HEIGHT = 720;

/**
 * 初始化白板窗口
 * @param win 主窗口实例
 */
export function initWhiteboardWindow(win: BrowserWindow) {
  mainWin = win;
  createWhiteboardWindow();
  loadWhiteboardFile();
  monitoringWhiteboardWindowEvents();
  monitoringMainWindowEvents();
  monitoringIpcEvents();
}

/**
 * 创建白板窗口
 * 配置窗口属性：尺寸、预加载脚本等
 */
export function createWhiteboardWindow() {
  whiteboardWin = new BrowserWindow({
    width: WHITEBOARD_WINDOW_WIDTH,
    height: WHITEBOARD_WINDOW_HEIGHT,
    show: false,
    webPreferences: {
      preload: paths.preload.entry,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 根据环境加载不同的页面源
  if (['development', 'mock'].includes(process.env.NODE_ENV)) {
    whiteboardWin.loadURL(paths.devServer);
  } else {
    whiteboardWin.loadFile(paths.renderer.entry);
  }

  whiteboardWin.setMenuBarVisibility(false);
}

/**
 * 加载白板窗口的页面内容
 * 根据环境（开发/生产）加载不同的页面源
 */
function loadWhiteboardFile() {
  if (app.isPackaged) {
    whiteboardWin?.loadFile(join(__dirname, `../../renderer/index.html`), {
      hash: `whiteboard?isAnnotationWin=false`,
    });
  } else {
    const url = `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_SERVER_PORT}`;
    const whiteboardUrl = `${url}#/whiteboard?isAnnotationWin=false`;
    whiteboardWin?.loadURL(whiteboardUrl);
  }

  // 处理外部链接
  whiteboardWin?.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * 监听主窗口事件
 * 处理应用退出和主窗口关闭的情况
 */
function monitoringMainWindowEvents() {
  app.on('window-all-closed', () => {
    mainWin = null;
    whiteboardWin = null;
  });

  mainWin?.on('close', () => {
    mainWin = null;
    if (whiteboardWin) {
      whiteboardWin.close();
      whiteboardWin = null;
    }
  });
}

/**
 * 监听白板窗口事件
 * 处理窗口关闭和加载完成的逻辑
 */
function monitoringWhiteboardWindowEvents() {
  whiteboardWin?.on('close', event => {
    if (mainWin !== null) {
      whiteboardWin?.hide();
      mainWin?.webContents.send('whiteboard:window-closed');
      event.preventDefault();
    } else {
      whiteboardWin = null;
    }
  });

  // 设置窗口标题
  whiteboardWin?.webContents.on('did-finish-load', () => {
    whiteboardWin?.setTitle('Whiteboard window');
  });
}

/**
 * 监听 IPC 事件
 * 处理白板功能相关的所有进程间通信
 */
function monitoringIpcEvents() {
  // 处理应用退出
  ipcMain.on('app-exit', () => {
    whiteboardWin?.close();
    whiteboardWin = null;
  });

  // 显示白板窗口
  ipcMain.on('whiteboard:show-window', () => {
    if (whiteboardWin) {
      whiteboardWin.show();
    }
  });

  // 隐藏白板窗口
  ipcMain.on('whiteboard:hide-window', () => {
    if (whiteboardWin) {
      whiteboardWin.webContents.send('whiteboard:clear');
      whiteboardWin.hide();
    }
  });

  // 从白板窗口停止白板功能
  ipcMain.on('whiteboard:stop-from-whiteboard-window', () => {
    if (whiteboardWin) {
      whiteboardWin.hide();
    }
    if (mainWin) {
      mainWin.webContents.send('whiteboard:stop-from-whiteboard-window');
    }
  });

  // 从白板窗口保存内容
  ipcMain.on('whiteboard:save-from-whiteboard-window', () => {
    if (mainWin) {
      mainWin.webContents.send('whiteboard:save-from-whiteboard-window');
    }
  });
}

import { BrowserWindow, screen, shell, app } from 'electron';
import { join } from 'path';
import { checkAndApplyDevicePrivilege } from '../services/device';
import { initWhiteboardWindow } from './whiteboard';
import { initAnnotationWindow } from './annotation';
import { paths } from '../config/paths';
import {setupAutoUpdater} from '../services/updater';

// 主窗口实例
let mainWindow: BrowserWindow | null = null;
// 通过URL Scheme传入的房间ID
let schemeRoomId = '';

/**
 * 设置通过URL Scheme传入的房间ID
 * @param roomId 房间ID
 */
export function setSchemeRoomId(roomId: string) {
  schemeRoomId = roomId;
}

/**
 * 设置并初始化主窗口
 * @returns 返回创建的主窗口实例
 */
export async function setupMainWindow() {
  // 检查并申请设备权限（如屏幕录制权限）
  const { isHasScreen } = await checkAndApplyDevicePrivilege();
  // 获取主显示器的工作区大小
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  console.log('preloadPath:', paths.preload); // 添加日志便于调试

  // 创建主窗口
  mainWindow = new BrowserWindow({
    title: 'Main window',
    width,
    height,
    minWidth: 1200,
    minHeight: 640,
    webPreferences: {
      preload: paths.preload.entry,      // 预加载脚本路径
      nodeIntegration: true,             // 启用Node集成
      contextIsolation: false,           // 关闭上下文隔离
    },
  });

  // 初始化自动更新功能
  setupAutoUpdater();

  // 监听窗口关闭事件
  mainWindow.on('close', () => {
    mainWindow = null;
  });

  // 加载窗口内容
  await loadMainWindow();
  // 设置窗口事件
  setupWindowEvents(isHasScreen);

  // 初始化白板窗口和标注窗口
  initWhiteboardWindow(mainWindow);
  initAnnotationWindow(mainWindow);

  return mainWindow;
}

/**
 * 根据环境加载主窗口内容
 */
async function loadMainWindow() {
  console.log('process.env.NODE_ENV', process.env.NODE_ENV);
  if (['development','mock'].includes(process.env.NODE_ENV)) {
    // 开发环境：加载开发服务器URL，安装开发工具
    await installDevTools();
    await mainWindow?.loadURL(paths.devServer);
    mainWindow?.webContents.openDevTools(); // 开发环境下默认打开开发者工具
  } else {
    // 生产环境：加载本地文件
    if (schemeRoomId) {
      // 如果有房间ID，则带上房间ID参数
      await mainWindow?.loadFile(paths.renderer.entry, {
        hash: `home?roomId=${schemeRoomId}`,
      });
    } else {
      await mainWindow?.loadFile(paths.renderer.entry);
    }
  }
}

/**
 * 设置窗口相关事件
 * @param isHasScreen 是否有屏幕录制权限
 */
function setupWindowEvents(isHasScreen: boolean) {
  // 页面加载完成后，发送设备权限状态到渲染进程
  mainWindow?.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', { isHasScreen });
  });

  // 处理新窗口打开请求
  mainWindow?.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url); // 使用默认浏览器打开外部链接
    return { action: 'deny' }; // 阻止创建新窗口
  });
}

/**
 * 安装开发工具（Vue Devtools）
 */
async function installDevTools() {
  try {
    const installExtension = require('electron-devtools-installer');
    await installExtension.default(installExtension.VUEJS_DEVTOOLS);
  } catch (err) {
    console.log('Unable to install vue-devtools:', err);
  }
}

/**
 * 获取主窗口实例
 * @returns 主窗口实例
 */
export function getMainWindow() {
  return mainWindow;
}

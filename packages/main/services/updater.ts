import { autoUpdater } from 'electron-updater';
import { ipcMain, dialog } from 'electron';
import { APP_CONFIG } from '../config';
import log from 'electron-log';
import { app } from 'electron';
import { getMainWindow } from '../windows/main';

export function setupAutoUpdater() {
  const mainWindow = getMainWindow();
  // 配置日志
  log.initialize({ preload: true });
  const logger = log.create('updater');
  
  if (logger.transports) {
    if(logger.transports.file){
      logger.transports.file.level = 'debug';
    }
    if(logger.transports.console){
      logger.transports.console.level = 'debug';
    }
  }

  autoUpdater.logger = logger;

  // 开发环境配置
  if (!app.isPackaged) {
    if (!process.env.UPDATE_URL) {
      logger.info('Skipping auto-updater in development - no UPDATE_URL provided');
      return;
    }
    logger.info('Running updater in development mode with custom update URL');
    // 强制开发环境更新检查
    autoUpdater.forceDevUpdateConfig = true;
    // 设置当前版本号，用于测试
    // autoUpdater.currentVersion = '2.7.1';  // 设置一个低于package.json中的版本号
  }

  // 设置更新服务器配置
  const updateConfig = {
    provider: 'generic',
    url: process.env.UPDATE_URL || APP_CONFIG.UPDATE_URL ,
    channel: 'latest',
    platform: process.platform,  // 明确指定平台
    updaterCacheDirName: 'electron-updater-cache' // 缓存目录
  };
  
  logger.info('Update config:', updateConfig);
  autoUpdater.setFeedURL(updateConfig);

  // 设置自动下载
  autoUpdater.autoDownload = false;
  
  // 设置允许预发布版本
  autoUpdater.allowPrerelease = false;

  // 错误处理
  autoUpdater.on('error', (err) => {
    logger.error('Update error:', err);
    // 通知渲染进程
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });

  // 检查更新
  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for updates...');
  });

  // 发现新版本
  autoUpdater.on('update-available', (info) => {
    logger.info('Update available:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
    // 开始下载
    autoUpdater.downloadUpdate();
  });

  // 没有新版本
  autoUpdater.on('update-not-available', () => {
    logger.info('Update not available');
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available');
    }
  });

  // 下载进度
  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progress);
    }
  });

  // 下载完成
  autoUpdater.on('update-downloaded', () => {
    logger.info('Update downloaded');
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded');
    }
  });

  // 监听安装命令
  ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // 监听来自渲染进程的更新检查请求
  ipcMain.on('check-for-update', () => {
    logger.info('Manual update check requested');
    autoUpdater.checkForUpdates().catch(err => {
      logger.error('Update check failed:', err);
    });
  });

  // 启动时检查更新和定时检查
  const checkForUpdates = () => {
    logger.info('Checking for updates...');
    autoUpdater.checkForUpdates().catch(err => {
      logger.error('Auto update check failed:', err);
    });
  };

  // 每小时检查一次更新
  setInterval(checkForUpdates, 1000 * 60 * 60);
  
  // 初始检查
  setTimeout(checkForUpdates, 3000); // 启动 3 秒后检查
}

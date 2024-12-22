import { app } from 'electron';
import { setupMainWindow } from './windows/main';
import { setupAutoUpdater } from './services/updater';
import { setupProtocolHandler } from './services/protocol';
import { setupCrashReporter } from './services/crash-reporter';

async function init() {
  // 初始化崩溃报告
  setupCrashReporter();

  // 确保单实例运行
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
  }

  await app.whenReady();

  // 初始化主窗口
  await setupMainWindow();
  
  // 设置自动更新
  setupAutoUpdater();
  
  // 设置协议处理
  setupProtocolHandler();
}

init().catch(console.error);

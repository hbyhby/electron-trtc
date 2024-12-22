import { app, crashReporter } from 'electron';
import { join } from 'path';

export function setupCrashReporter() {
  // Enable crash capture
  crashReporter.start({
    productName: 'electron-tui-room',
    companyName: 'Tencent Cloud',
    submitURL: 'https://www.xxx.com',
    uploadToServer: false,
    ignoreSystemCrashHandler: false,
  });

  try {
    // Low version of electron
    const crashFilePath = join(app.getPath('temp'), `${app.getName()} Crashes`);
    console.log('————————crash path:', crashFilePath);

    // High version of electron
    const crashDumpsDir = app.getPath('crashDumps');
    console.log('————————crashDumpsDir:', crashDumpsDir);
  } catch (err) {
    console.error('Failed to get path to crashed file', err);
  }
} 
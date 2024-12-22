import { app } from 'electron';
import { resolve } from 'path';
import { getMainWindow } from '../windows/main';

const PROTOCOL = 'tuiroom';

export function setupProtocolHandler() {
  registerScheme();
  handleProtocolEvents();
}

function registerScheme() {
  const args = [];
  if (!app.isPackaged) {
    args.push(resolve(process.argv[1]));
  }
  args.push('--');
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, args);
  handleArgv(process.argv);
}

function handleArgv(argv: string[]) {
  const prefix = `${PROTOCOL}:`;
  const offset = app.isPackaged ? 1 : 2;
  const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
  if (url) handleUrl(url);
}

function handleUrl(url: string) {
  const urlObj = new URL(url);
  const { searchParams } = urlObj;
  const roomId = searchParams.get('roomId') || '';
  
  const mainWindow = getMainWindow();
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('launch-room', roomId);
  }
}

function handleProtocolEvents() {
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleUrl(url);
  });
} 
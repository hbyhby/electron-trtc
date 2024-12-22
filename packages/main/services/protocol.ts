import { app } from 'electron';
import { resolve } from 'path';
import { getMainWindow } from '../windows/main';
import { APP_CONFIG } from '../config';

const { name: protocolName, scheme: protocolScheme } = APP_CONFIG.protocol;

/**
 * 支持的协议操作类型枚举
 * 定义了所有可用的URL操作命令
 */
export enum ProtocolAction {
  LAUNCH_ROOM = 'launch-room',      // 启动房间
  JOIN_MEETING = 'join-meeting',    // 加入会议
  OPEN_SETTINGS = 'open-settings',  // 打开设置
  SHOW_NOTIFICATION = 'show-notification' // 显示通知
}

/**
 * 协议处理器配置接口
 * @property protocol - 协议名称
 * @property actions - 操作处理器映射表
 */
interface ProtocolConfig {
  protocol: string;
  actions: Map<string, (params: URLSearchParams) => void>;
}

/**
 * 默认协议配置
 * 包含所有标准操作的处理器
 */
const defaultConfig: ProtocolConfig = {
  protocol: protocolName,
  actions: new Map([
    [ProtocolAction.LAUNCH_ROOM, handleLaunchRoom],
    [ProtocolAction.JOIN_MEETING, handleJoinMeeting],
    [ProtocolAction.OPEN_SETTINGS, handleOpenSettings],
    [ProtocolAction.SHOW_NOTIFICATION, handleShowNotification]
  ])
};

/**
 * 初始化协议处理器
 * @param config - 可选的自定义配置，将与默认配置合并
 */
export function setupProtocolHandler(config: Partial<ProtocolConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  registerScheme(finalConfig.protocol);
  handleProtocolEvents(finalConfig);
}

/**
 * 注册自定义URL scheme到操作系统
 * @param protocol - 要注册的协议名称
 */
function registerScheme(protocol: string) {
  const args = [];
  if (!app.isPackaged) {
    args.push(resolve(process.argv[1]));
  }
  args.push('--');
  app.setAsDefaultProtocolClient(protocol, process.execPath, args);
  handleArgv(process.argv);
}

/**
 * 处理命令行参数中的协议URL
 * @param argv - 命令行参数数组
 */
function handleArgv(argv: string[]) {
  const prefix = protocolScheme;
  const offset = app.isPackaged ? 1 : 2;
  const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
  if (url) handleUrl(url);
}

/**
 * 处理协议URL
 * @param url - 协议URL字符串
 * @param config - 协议配置对象
 */
function handleUrl(url: string, config: ProtocolConfig = defaultConfig) {
  try {
    const urlObj = new URL(url);
    const { searchParams, pathname } = urlObj;
    const action = pathname.slice(2); // 移除开头的 '//'

    const handler = config.actions.get(action);
    if (handler) {
      handler(searchParams);
    } else {
      console.warn(`未知的协议操作: ${action}`);
    }
  } catch (error) {
    console.error('处理协议URL时出错:', error);
  }
}

/**
 * 设置协议URL事件监听器
 * @param config - 协议配置对象
 */
function handleProtocolEvents(config: ProtocolConfig) {
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleUrl(url, config);
  });
}

/**
 * 处理启动房间的操作
 * @param params - URL查询参数
 */
function handleLaunchRoom(params: URLSearchParams) {
  const roomId = params.get('roomId') || '';
  const mainWindow = getMainWindow();
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('launch-room', roomId);
  }
}

/**
 * 处理加入会议的操作
 * @param params - URL查询参数
 */
function handleJoinMeeting(params: URLSearchParams) {
  const meetingId = params.get('meetingId');
  const password = params.get('password');
  const mainWindow = getMainWindow();
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('join-meeting', { meetingId, password });
  }
}

/**
 * 处理打开设置的操作
 * @param params - URL查询参数
 */
function handleOpenSettings(params: URLSearchParams) {
  const section = params.get('section') || 'general';
  const mainWindow = getMainWindow();
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('open-settings', section);
  }
}

/**
 * 处理显示通知的操作
 * @param params - URL查询参数
 */
function handleShowNotification(params: URLSearchParams) {
  const mainWindow = getMainWindow();
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('show-notification', {
      title: params.get('title') || '',
      message: params.get('message') || '',
      type: params.get('type') || 'info'
    });
  }
}

/**
 * 生成协议URL
 * @param action - 操作类型
 * @param params - URL参数对象
 * @returns 完整的协议URL字符串
 * @example
 * generateProtocolUrl(ProtocolAction.LAUNCH_ROOM, { roomId: '123' })
 * // 返回: "tuiroom://launch-room?roomId=123"
 */
export function generateProtocolUrl(
  action: ProtocolAction,
  params: Record<string, string>
): string {
  const url = new URL(`${protocolScheme}${action}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
} 
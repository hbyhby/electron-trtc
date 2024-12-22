import { join } from 'path';

const isDev = ['development', 'mock'].includes(process.env.NODE_ENV || '');

export const paths = {
  // preload相关路径
  preload: {
    entry: isDev
      ? join(__dirname, '../../dist/preload/index.cjs')
      : join(__dirname, '../../preload/index.cjs'),
    dist: join(__dirname, '../../../dist/preload'),
  },

  // renderer相关路径
  renderer: {
    entry: join(__dirname, '../../renderer/index.html'),
    dist: join(__dirname, '../../../dist/renderer'),
  },

  // 开发服务器URL
  devServer: `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_SERVER_PORT}`,
};

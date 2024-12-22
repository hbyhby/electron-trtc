import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { ConfigEnv, loadEnv, UserConfig } from 'vite';
import { viteMockServe } from 'vite-plugin-mock';
import svgLoader from 'vite-svg-loader';
import resolve from 'vite-plugin-resolve';
import renderer from 'vite-plugin-electron-renderer';
import pkg from '../../package.json';

const CWD = process.cwd();

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv): UserConfig => {
  const { VITE_BASE_URL, VITE_API_URL_PREFIX } = loadEnv(mode, CWD);
  return {
    mode,
    // mode: process.env.NODE_ENV,
    root: __dirname,
    base: VITE_BASE_URL,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/style/global.scss" as *;
          `,
        },
        less: {
          modifyVars: {
            hack: `true; @import (reference) "@/style/variables.less";`,
          },
          math: 'strict',
          javascriptEnabled: true,
        },
      },
    },

    plugins: [
      vue(),
      renderer(),
      resolve({
        'trtc-electron-sdk': `
            const TRTCCloud = require("trtc-electron-sdk");
            const TRTCParams = TRTCCloud.TRTCParams;
            const TRTCAppScene = TRTCCloud.TRTCAppScene;
            const TRTCVideoStreamType = TRTCCloud.TRTCVideoStreamType;
            const TRTCScreenCaptureSourceType = TRTCCloud.TRTCScreenCaptureSourceType;
            const TRTCVideoEncParam = TRTCCloud.TRTCVideoEncParam;
            const Rect = TRTCCloud.Rect;
            const TRTCAudioQuality = TRTCCloud.TRTCAudioQuality;
            const TRTCScreenCaptureSourceInfo = TRTCCloud.TRTCScreenCaptureSourceInfo;
            const TRTCDeviceInfo = TRTCCloud.TRTCDeviceInfo;
            const TRTCVideoQosPreference = TRTCCloud.TRTCVideoQosPreference;
            const TRTCQualityInfo = TRTCCloud.TRTCQualityInfo;
            const TRTCQuality = TRTCCloud.TRTCQuality;
            const TRTCStatistics = TRTCCloud.TRTCStatistics;
            const TRTCVolumeInfo = TRTCCloud.TRTCVolumeInfo;
            const TRTCDeviceType = TRTCCloud.TRTCDeviceType;
            const TRTCDeviceState = TRTCCloud.TRTCDeviceState;
            const TRTCBeautyStyle = TRTCCloud.TRTCBeautyStyle;
            const TRTCVideoResolution = TRTCCloud.TRTCVideoResolution;
            const TRTCVideoResolutionMode = TRTCCloud.TRTCVideoResolutionMode;
            const TRTCVideoMirrorType = TRTCCloud.TRTCVideoMirrorType;
            const TRTCVideoRotation = TRTCCloud.TRTCVideoRotation;
            const TRTCVideoFillMode = TRTCCloud.TRTCVideoFillMode;
            const TRTCRoleType = TRTCCloud.TRTCRoleType;
            const TRTCScreenCaptureProperty = TRTCCloud.TRTCScreenCaptureProperty;
            export {
              TRTCParams,
              TRTCAppScene,
              TRTCVideoStreamType,
              TRTCScreenCaptureSourceType,
              TRTCVideoEncParam,
              Rect,
              TRTCAudioQuality,
              TRTCScreenCaptureSourceInfo,
              TRTCDeviceInfo,
              TRTCVideoQosPreference,
              TRTCQualityInfo,
              TRTCStatistics,
              TRTCVolumeInfo,
              TRTCDeviceType,
              TRTCDeviceState,
              TRTCBeautyStyle,
              TRTCVideoResolution,
              TRTCVideoResolutionMode,
              TRTCVideoMirrorType,
              TRTCVideoRotation,
              TRTCVideoFillMode,
              TRTCRoleType,
              TRTCQuality,
              TRTCScreenCaptureProperty,
            };
            export default TRTCCloud.default;
          `,
      }),
      vueJsx(),
      viteMockServe({
        mockPath: 'mock',
        enable: true,
      }),
      svgLoader(),
    ],
    optimizeDeps: {
      include: ['@tencentcloud/tuiroom-engine-electron'],
    },
    server: {
      host: pkg.env.VITE_DEV_SERVER_HOST,
      port: pkg.env.VITE_DEV_SERVER_PORT,
      proxy: {
        '/api': {
          target: 'https://service.trtc.qcloud.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
        [VITE_API_URL_PREFIX]: 'http://127.0.0.1:3000/',
      },
    },
  };
};

import { ViewModuleIcon } from 'tdesign-icons-vue-next';
import { RouteRecordRaw } from 'vue-router';

const trtc: Array<RouteRecordRaw> = [
  {
    path: '/trtc',
    name: 'trtc',
    component: () => import('@/layouts/index.vue'),
    redirect: '/trtc/room',
    meta: { title: 'TRTC', icon: ViewModuleIcon },
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/pages/trtc/home.vue'),
        meta: { title: '会议室' },
      },
      {
        path: 'room',
        name: 'room',
        component: () => import('@/pages/trtc/room.vue'),
        meta: { title: '会议' },
      },
      {
        path: 'whiteboard',
        name: 'whiteboard',
        component: () => import('@/pages/trtc/whiteboard.vue'),
        meta: { title: '白板' },
      },
    ],
  },
];

export default trtc; 
import type { RouteRecordRaw } from 'vue-router'

const chatRoutes: RouteRecordRaw[] = [
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/chat/chatPage.vue'),
    meta: {
      title: 'Chat',
    },
  },
  {
    path: '/chat/:id',
    name: 'ChatSession',
    component: () => import('@/views/chat/chatPage.vue'),
    meta: {
      title: 'Chat Session',
    },
  },
  {
    path: '/chat/settings',
    name: 'ChatSettings',
    component: () => import('@/views/chat/chatSettings.vue'),
    meta: {
      title: 'Chat Settings',
    },
  },
]

export default chatRoutes

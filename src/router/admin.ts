import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: () => import('@/layout/AdminLayout.vue'),
    meta: {
      title: 'Admin',
      requiresAuth: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/admin/dashBoard.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/admin/user/userList.vue'),
        meta: { title: 'User List' },
      },
      {
        path: 'users/create',
        name: 'CreateUser',
        component: () => import('@/views/admin/user/userDetail.vue'),
        meta: { title: 'Create User' },
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('@/views/admin/user/userDetail.vue'),
        meta: { title: 'User Detail' },
      },
      {
        path: 'conversations',
        name: 'ConversationAnalysis',
        component: () => import('@/views/admin/conversation/conversationAnalysis.vue'),
        meta: { title: 'Conversation Analysis' },
      },
      {
        path: 'conversations/list',
        name: 'ConversationList',
        component: () => import('@/views/admin/conversation/conversationList.vue'),
        meta: { title: 'Conversation List' },
      },
      {
        path: 'settings',
        name: 'SystemSettings',
        component: () => import('@/views/admin/systemSettings.vue'),
        meta: { title: 'System Settings' },
      },
    ],
  },
]

export default adminRoutes

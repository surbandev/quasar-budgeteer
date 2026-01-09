const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('pages/PageLogin.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('pages/PageRegister.vue'),
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('pages/PageDashboard.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'spending',
        name: 'Spending',
        component: () => import('pages/PageSpending.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('pages/PageCalendar.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'transaction',
        name: 'Transaction',
        component: () => import('pages/PageTransaction.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'user-settings',
        name: 'UserSettings',
        component: () => import('pages/PageUserSettings.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'profile-settings',
        name: 'ProfileSettings',
        component: () => import('pages/PageProfileSettings.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'create-scenario',
        name: 'CreateScenario',
        component: () => import('pages/PageCreateScenario.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'delete-scenario',
        name: 'DeleteScenario',
        component: () => import('pages/PageDeleteScenario.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import('pages/PageFeedback.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'entries',
        component: () => import('pages/PageEntries.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes

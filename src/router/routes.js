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
        path: 'overview',
        name: 'Overview',
        component: () => import('pages/PageOverview.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'spending',
        name: 'Spending',
        component: () => import('pages/PageSpending.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'budget',
        name: 'Budget',
        component: () => import('pages/PageCalendar.vue'),
        meta: { requiresAuth: true },
        // The standalone calendar view was folded into Overview. Only the
        // transaction add/edit and scenarios views remain live here; anything
        // else (bare /budget or the deprecated ?view=calendar) goes to Overview
        // so users never hit the dead "Calendar moved to Overview" stub.
        beforeEnter: (to) => {
          const view = to.query.view
          if (view !== 'transaction' && view !== 'scenarios') {
            return { path: '/overview' }
          }
          return true
        },
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
        path: 'compare',
        name: 'ScenarioCompare',
        component: () => import('pages/PageScenarioCompare.vue'),
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
      {
        path: 'tools',
        name: 'Tools',
        component: () => import('pages/PageTools.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'weave',
        name: 'Weave',
        component: () => import('pages/PageWeave.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin-settings',
        name: 'AdminSettings',
        component: () => import('pages/PageAdminSettings.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
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

import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Properties from '../views/Properties.vue'
import PropertyDetail from '../views/PropertyDetail.vue'
import Tenants from '../views/Tenants.vue'
import TenantDetail from '../views/TenantDetail.vue'

const routes = [
  { path: '/tenants', component: Tenants, meta: { requiresAuth: true } },
  { path: '/tenants/:id', component: TenantDetail, meta: { requiresAuth: true } },
  { path: '/properties/:id', component: PropertyDetail, meta: { requiresAuth: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/properties', component: Properties, meta: { requiresAuth: true } },
]
const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const { supabase } = await import('../lib/supabase')
  const { data } = await supabase.auth.getSession()
  if (to.meta.requiresAuth && !data.session) return '/login'
})

export default router
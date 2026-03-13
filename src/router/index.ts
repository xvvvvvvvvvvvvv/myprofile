import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/company', name: 'company', component: () => import('../views/CompanyProjectsView.vue') },
    { path: '/personal', name: 'personal', component: () => import('../views/PersonalProjectsView.vue') }
  ]
})

export default router
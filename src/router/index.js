import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy load components
const Dashboard = () => import('@/views/Dashboard.vue')
const Transactions = () => import('@/views/Transactions.vue')
const Categories = () => import('@/views/Categories.vue')
const Login = () => import('@/views/Login.vue')

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true }
    },
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/transactions',
        name: 'Transactions',
        component: Transactions,
        meta: { requiresAuth: true }
    },
    {
        path: '/categories',
        name: 'Categories',
        component: Categories,
        meta: { requiresAuth: true }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
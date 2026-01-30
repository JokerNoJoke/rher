import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Reader from '../views/Reader.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/read',
            name: 'reader',
            component: Reader
            // Note: We might want /read/:id or passing query params. For now local file path might be passed via store or query.
            // Changing to include a query param or just simple path.
            // Plan said /read/:id, but for local files ID is tricky. Base64 path?
            // Or just /read and use store's "current book". Let's stick to /read for now and use store.
        }
    ]
})

export default router

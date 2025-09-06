import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import syncService from '@/services/syncService'
import './assets/main.css'
import 'flowbite'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
syncService.init()

app.mount('#app')
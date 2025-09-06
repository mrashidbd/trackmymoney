// (async () => {
//     try {
//         const { default: Dexie } = await import('dexie')
//         await Dexie.delete('TrackMyMoneyDB')
//         localStorage.clear()
//         console.log('Emergency database reset completed')
//     } catch (e) {
//         console.log('Emergency reset failed, continuing anyway')
//     }
// })()

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import syncService from '@/services/syncService'
import '@/utils/resetDatabase.js'
import './assets/main.css'
import 'flowbite'

const app = createApp(App)
const pinia = createPinia()

// if (localStorage.getItem('db_reset_needed') !== 'done') {
//     localStorage.clear()
//     if ('indexedDB' in window) {
//         indexedDB.deleteDatabase('TrackMyMoneyDB')
//     }
//     localStorage.setItem('db_reset_needed', 'done')
//     window.location.reload()
// }

app.use(pinia)
app.use(router)
syncService.init()

app.mount('#app')
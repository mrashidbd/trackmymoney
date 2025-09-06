<template>
  <div class="fixed top-4 right-4 z-40">
    <!-- Offline indicator -->
    <div v-if="!isOnline" class="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg mb-2 flex items-center space-x-2">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L18.364 18.364M5.636 5.636l12.728 12.728" />
      </svg>
      <span class="text-sm font-medium">Offline</span>
    </div>

    <!-- Sync status -->
    <div v-if="syncStatus.isSyncing" class="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg mb-2 flex items-center space-x-2">
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span class="text-sm font-medium">Syncing...</span>
    </div>

    <!-- Sync success -->
    <div v-if="showSyncSuccess" class="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg mb-2 flex items-center space-x-2">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span class="text-sm font-medium">Synced</span>
    </div>

    <!-- Unsynced items indicator -->
    <div v-if="unsyncedCount > 0 && isOnline" class="bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg mb-2 flex items-center space-x-2 cursor-pointer" @click="forceSync">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span class="text-sm font-medium">{{ unsyncedCount }} pending sync</span>
    </div>

    <!-- Update available -->
    <div v-if="updateAvailable" class="bg-purple-500 text-white px-3 py-2 rounded-lg shadow-lg mb-2 flex items-center space-x-2">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span class="text-sm font-medium cursor-pointer" @click="updateApp">Update available</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOnline } from '@vueuse/core'
import syncService from '@/services/syncService'
import offlineStorage from '@/services/offlineStorage'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()

const isOnline = useOnline()
const syncStatus = ref({ isSyncing: false })
const showSyncSuccess = ref(false)
const updateAvailable = ref(false)
const unsyncedCount = ref(0)

let updateSW = null

const getCurrentUser = () => {
  const userData = localStorage.getItem('trackmymoney_user')
  return userData ? JSON.parse(userData) : null
}

const checkUnsyncedItems = async () => {
  const user = getCurrentUser()
  if (!user?.user?.id) return

  try {
    const stats = await offlineStorage.getStats()
    unsyncedCount.value = stats.unsyncedItems
  } catch (error) {
    console.error('Error checking unsynced items:', error)
  }
}

const forceSync = async () => {
  if (!isOnline.value) return

  try {
    await Promise.all([
      categoriesStore.forceSync(),
      transactionsStore.forceSync()
    ])
    await checkUnsyncedItems()
  } catch (error) {
    console.error('Force sync failed:', error)
  }
}

const updateApp = () => {
  if (updateSW) {
    updateSW()
  }
}

// Listen for sync status changes
const handleSyncStatus = (status) => {
  syncStatus.value = status

  if (status.status === 'completed') {
    showSyncSuccess.value = true
    setTimeout(() => {
      showSyncSuccess.value = false
    }, 3000)
    checkUnsyncedItems()
  }
}

// Listen for service worker updates
const handleSWUpdate = (event) => {
  updateSW = event.updateSW
  updateAvailable.value = true
}

onMounted(async () => {
  // Register onUnmounted FIRST before any await
  let unsyncedInterval = null

  onUnmounted(() => {
    if (unsyncedInterval) {
      clearInterval(unsyncedInterval)
    }
  })

  // Listen for sync events
  syncService.onSyncStatusChange(handleSyncStatus)

  // Check for unsynced items periodically
  checkUnsyncedItems()
  unsyncedInterval = setInterval(checkUnsyncedItems, 30000) // Every 30 seconds

  // Listen for SW updates
  if ('serviceWorker' in navigator) {
    const { registerSW } = await import('virtual:pwa-register')
    registerSW({
      onNeedRefresh: () => {
        updateAvailable.value = true
      },
      onOfflineReady: () => {
        console.log('App ready to work offline')
      },
      onRegisterError: (error) => {
        console.error('SW registration error:', error)
      }
    })
  }

  // Listen for background sync messages
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'BACKGROUND_SYNC') {
        forceSync()
      }
    })
  }
})
</script>
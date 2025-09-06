<template>
  <div v-if="showInstallPrompt" class="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
    <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium text-gray-900">Install Track My Money</h3>
          <p class="text-sm text-gray-500 mt-1">
            Add to your home screen for quick access and offline usage
          </p>
          <div class="flex space-x-2 mt-3">
            <button
                @click="installApp"
                class="bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              Install
            </button>
            <button
                @click="dismissPrompt"
                class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
            @click="dismissPrompt"
            class="flex-shrink-0 text-gray-400 hover:text-gray-500"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showInstallPrompt = ref(false)
const deferredPrompt = ref(null)

let installPromptHandler = null

const handleBeforeInstallPrompt = (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault()

  // Stash the event so it can be triggered later
  deferredPrompt.value = e

  // Check if user has previously dismissed
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  const dismissTime = dismissed ? parseInt(dismissed) : 0
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)

  // Show prompt if not dismissed or dismissed more than 24 hours ago
  if (!dismissed || dismissTime < oneDayAgo) {
    showInstallPrompt.value = true
  }
}

const installApp = async () => {
  if (!deferredPrompt.value) return

  // Show the install prompt
  deferredPrompt.value.prompt()

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.value.userChoice

  console.log(`User response to the install prompt: ${outcome}`)

  // Clear the deferredPrompt
  deferredPrompt.value = null
  showInstallPrompt.value = false

  // Track installation
  if (outcome === 'accepted') {
    localStorage.setItem('pwa-installed', 'true')
  }
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}

const handleAppInstalled = () => {
  console.log('PWA was installed')
  showInstallPrompt.value = false
  localStorage.setItem('pwa-installed', 'true')
}

onMounted(() => {
  // Don't show if already installed
  if (localStorage.getItem('pwa-installed') === 'true') {
    return
  }

  // Check if already installed via display mode
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    localStorage.setItem('pwa-installed', 'true')
    return
  }

  // Check if running as PWA on iOS
  if (window.navigator.standalone === true) {
    localStorage.setItem('pwa-installed', 'true')
    return
  }

  installPromptHandler = handleBeforeInstallPrompt
  window.addEventListener('beforeinstallprompt', installPromptHandler)
  window.addEventListener('appinstalled', handleAppInstalled)
})

onUnmounted(() => {
  if (installPromptHandler) {
    window.removeEventListener('beforeinstallprompt', installPromptHandler)
    window.removeEventListener('appinstalled', handleAppInstalled)
  }
})
</script>
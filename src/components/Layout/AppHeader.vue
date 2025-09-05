<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Left side: Menu button and title -->
        <div class="flex items-center space-x-4">
          <!-- Mobile menu button -->
          <button
              @click="$emit('toggleSidebar')"
              class="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Page title -->
          <h1 class="text-2xl font-bold text-gray-900">
            {{ pageTitle }}
          </h1>
        </div>

        <!-- Right side: User menu -->
        <div class="flex items-center space-x-4">
          <!-- User dropdown -->
          <div class="relative" ref="dropdownRef">
            <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">
                    {{ authStore.user?.name?.charAt(0) || 'U' }}
                  </span>
                </div>
                <span class="hidden md:block text-sm font-medium text-gray-700">
                  {{ authStore.user?.name || 'User' }}
                </span>
              </div>
              <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown menu -->
            <div
                v-show="showUserMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              <div class="py-1">
                <button
                    @click="logout"
                    class="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineEmits(['toggleSidebar'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const dropdownRef = ref(null)

const pageTitle = computed(() => {
  const titles = {
    'Dashboard': 'Dashboard',
    'Transactions': 'Transactions',
    'Categories': 'Categories'
  }
  return titles[route.name] || 'Track My Money'
})

const logout = async () => {
  authStore.logout()
  showUserMenu.value = false
  router.push('/login')
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
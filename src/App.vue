<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Show layout only for authenticated users -->
    <AppLayout v-if="authStore.isAuthenticated">
      <router-view />
    </AppLayout>

    <!-- Show login page for unauthenticated users -->
    <router-view v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/Layout/AppLayout.vue'

const authStore = useAuthStore()

onMounted(() => {
  // Initialize auth state from localStorage
  authStore.initAuth()
})
</script>

<style scoped>
/* Any global app styles can go here */
</style>
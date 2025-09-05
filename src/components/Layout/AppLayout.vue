<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <AppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Main content area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <!-- Main content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
        <div class="max-w-7xl mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const sidebarOpen = ref(false)
</script>
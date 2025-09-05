<template>
  <!-- Mobile backdrop -->
  <div
      v-if="isOpen"
      class="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-40"
      @click="$emit('close')"
  ></div>

  <!-- Sidebar -->
  <div
      :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <!-- Sidebar header -->
    <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <span class="text-xl font-bold text-gray-900">Track My Money</span>
      </div>

      <!-- Close button for mobile -->
      <button
          @click="$emit('close')"
          class="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="mt-6 px-3">
      <div class="space-y-1">
        <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            :class="[
            'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
            $route.name === item.name
              ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          ]"
            @click="$emit('close')"
        >
          <component
              :is="item.icon"
              :class="[
              'mr-3 h-5 w-5 flex-shrink-0',
              $route.name === item.name ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
            ]"
          />
          {{ item.label }}
        </router-link>
      </div>
    </nav>

    <!-- Bottom section -->
    <div class="absolute bottom-0 w-full p-4 border-t border-gray-200">
      <div class="text-xs text-gray-500 text-center">
        <p>Track My Money v1.0</p>
        <p class="mt-1">Personal Finance Tracker</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

// Navigation items
const navigation = [
  {
    name: 'Dashboard',
    label: 'Dashboard',
    to: '/',
    icon: 'DashboardIcon'
  },
  {
    name: 'Transactions',
    label: 'Transactions',
    to: '/transactions',
    icon: 'TransactionIcon'
  },
  {
    name: 'Categories',
    label: 'Categories',
    to: '/categories',
    icon: 'CategoryIcon'
  }
]

// Icon components (inline SVGs)
const DashboardIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5v4" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v4" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 5v4" />
    </svg>
  `
}

const TransactionIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  `
}

const CategoryIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  `
}
</script>
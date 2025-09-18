<template>
  <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
      <p class="text-sm text-gray-500 mb-6">{{ errorMessage }}</p>
      <button
          @click="handleRetry"
          class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('An unexpected error occurred')

onErrorCaptured((error) => {
  console.error('Error caught by boundary:', error)
  hasError.value = true
  errorMessage.value = error.message || 'An unexpected error occurred'
  return false
})

const handleRetry = () => {
  hasError.value = false
  location.reload()
}
</script>
<template>
  <!-- Modal Backdrop -->
  <div
      v-if="isOpen"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="handleBackdropClick"
  >
    <!-- Modal Content -->
    <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl bg-white rounded-lg shadow-lg">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ transaction ? 'Edit Transaction' : 'Add New Transaction' }}
        </h3>
        <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <TransactionForm
            :transaction="transaction"
            @success="handleSuccess"
            @cancel="closeModal"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import TransactionForm from './TransactionForm.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  transaction: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

function closeModal() {
  emit('close')
}

function handleBackdropClick(event) {
  // Close modal only if clicked on backdrop, not on modal content
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

function handleSuccess(result) {
  emit('success', result)
  closeModal()
}
</script>
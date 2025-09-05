<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your transaction categories</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button class="btn-primary inline-flex items-center space-x-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Category</span>
        </button>
      </div>
    </div>

    <!-- Categories Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Income Categories -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            Income Categories
          </h3>
          <span class="text-sm text-gray-500">7 categories</span>
        </div>
        <div class="space-y-3">
          <div v-for="category in incomeCategories" :key="category.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="font-medium text-gray-900">{{ category.name }}</span>
            <div class="flex items-center space-x-2">
              <button class="text-blue-600 hover:text-blue-700">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button class="text-red-600 hover:text-red-700">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Categories -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <div class="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            Expense Categories
          </h3>
          <span class="text-sm text-gray-500">7 categories</span>
        </div>
        <div class="space-y-3">
          <div v-for="category in expenseCategories" :key="category.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="font-medium text-gray-900">{{ category.name }}</span>
            <div class="flex items-center space-x-2">
              <button class="text-blue-600 hover:text-blue-700">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button class="text-red-600 hover:text-red-700">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Default categories as specified in requirements
const incomeCategories = ref([
  { id: 1, name: 'Monthly Fund', type: 'income' },
  { id: 2, name: 'Special Fund', type: 'income' },
  { id: 3, name: 'Donation', type: 'income' },
  { id: 4, name: 'Personal Money', type: 'income' },
  { id: 5, name: 'Bank Loan', type: 'income' },
  { id: 6, name: 'Borrowed Money', type: 'income' },
  { id: 7, name: 'Others', type: 'income' }
])

const expenseCategories = ref([
  { id: 8, name: 'Employee Salary', type: 'expense' },
  { id: 9, name: 'Foods & Treats', type: 'expense' },
  { id: 10, name: 'Conveyances', type: 'expense' },
  { id: 11, name: 'Purchase', type: 'expense' },
  { id: 12, name: 'Rents', type: 'expense' },
  { id: 13, name: 'Utility Bills', type: 'expense' },
  { id: 14, name: 'Others', type: 'expense' }
])
</script>
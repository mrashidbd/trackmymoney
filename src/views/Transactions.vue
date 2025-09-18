<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ isViewingOtherUser ? 'User Transactions' : 'Transactions' }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ isViewingOtherUser ? `Viewing transactions for User ID: {viewingUserId}` : 'Manage your income and expenses' }}
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button
            v-if="!isViewingOtherUser"
            @click="openTransactionModal()"
            class="btn-primary inline-flex items-center space-x-2"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Transaction</span>
        </button>
        <router-link
            v-else
            to="/users"
            class="btn-secondary inline-flex items-center space-x-2"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Users</span>
        </router-link>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
              v-model="searchQuery"
              type="text"
              placeholder="Search transactions..."
              class="input-field"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select v-model="filterType" @change="handleTypeFilterChange" class="input-field">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select v-model="filterCategory" @change="handleCategoryFilterChange" class="input-field">
            <option value="">{{ filterType ? 'All Categories' : 'All Categories' }}</option>
            <option
                v-for="category in availableCategories"
                :key="category.id"
                :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select v-model="filterDateRange" class="input-field" @change="handleDateRangeChange">
            <option value="all">All Time</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="card">
      <div class="overflow-hidden">
        <!-- Empty State -->
        <div v-if="filteredTransactions.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900">
            {{ transactionsStore.transactions.length === 0 ? 'No transactions found' : 'No matching transactions' }}
          </h3>
          <p class="mt-2 text-sm text-gray-500">
            {{ transactionsStore.transactions.length === 0
              ? 'Get started by creating your first transaction.'
              : 'Try adjusting your filters to see more results.'
            }}
          </p>
          <div v-if="transactionsStore.transactions.length === 0" class="mt-6">
            <button
                @click="openTransactionModal()"
                class="btn-primary inline-flex items-center space-x-2"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Your First Transaction</span>
            </button>
          </div>
        </div>

        <!-- Transactions List -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="transaction in paginatedTransactions" :key="transaction.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center mr-3',
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    ]">
                    <svg
                        :class="[
                          'w-4 h-4',
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        ]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path
                          v-if="transaction.type === 'income'"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 11l5-5m0 0l5 5m-5-5v12"
                      />
                      <path
                          v-else
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 13l-5 5m0 0l-5-5m5 5V6"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ transaction.description || 'No description' }}
                    </div>
                    <div class="text-sm text-gray-500">
                      ID: {{ transaction.id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ getCategoryName(transaction.categoryId) }}
                  </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    transaction.type === 'income'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  ]">
                    {{ transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) }}
                  </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span :class="[
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  ]">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(transaction.date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                <div v-if="!isViewingOtherUser" class="flex items-center justify-end space-x-2">
                  <button
                      @click="editTransaction(transaction)"
                      class="text-blue-600 hover:text-blue-700"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                      @click="deleteTransaction(transaction)"
                      class="text-red-600 hover:text-red-700"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <span v-else class="text-sm text-gray-500">View only</span>
              </td>
            </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                  @click="currentPage > 1 && (currentPage--)"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                  @click="currentPage < totalPages && (currentPage++)"
                  :disabled="currentPage === totalPages"
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing
                  <span class="font-medium">{{ startIndex + 1 }}</span>
                  to
                  <span class="font-medium">{{ Math.min(endIndex, filteredTransactions.length) }}</span>
                  of
                  <span class="font-medium">{{ filteredTransactions.length }}</span>
                  results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                      @click="currentPage > 1 && (currentPage--)"
                      :disabled="currentPage === 1"
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                      v-for="page in visiblePages"
                      :key="page"
                      @click="currentPage = page"
                      :class="[
                      'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                      page === currentPage
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    ]"
                  >
                    {{ page }}
                  </button>
                  <button
                      @click="currentPage < totalPages && (currentPage++)"
                      :disabled="currentPage === totalPages"
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Modal -->
    <TransactionModal
        :is-open="showTransactionModal"
        :transaction="editingTransaction"
        @close="closeTransactionModal"
        @success="handleTransactionSuccess"
    />

    <!-- Delete Confirmation Modal -->
    <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        @click="showDeleteModal = false"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-5">Delete Transaction</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
          </div>
          <div class="flex gap-4 mt-4">
            <button
                @click="confirmDelete"
                class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
                @click="showDeleteModal = false"
                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'
import TransactionModal from '@/components/Transaction/TransactionModal.vue'

import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()

// Reactive data
const showTransactionModal = ref(false)
const editingTransaction = ref(null)
const showDeleteModal = ref(false)
const deletingTransaction = ref(null)

// Filters
const searchQuery = ref('')
const filterType = ref('')
const filterCategory = ref('')
const filterDateRange = ref('all')

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10

// Computed properties for available categories based on selected type
const availableCategories = computed(() => {
  if (!filterType.value) return categoriesStore.categories // Show all categories when no type selected
  return filterType.value === 'income'
      ? categoriesStore.incomeCategories
      : categoriesStore.expenseCategories
})

// Check if viewing another user's transactions (superadmin only)
const viewingUserId = computed(() => {
  if (authStore.isSuperAdmin && route.query.userId) {
    return parseInt(route.query.userId)
  }
  return null
})

const isViewingOtherUser = computed(() => viewingUserId.value !== null)

const filteredTransactions = computed(() => {
  let transactions = [...transactionsStore.transactions]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    transactions = transactions.filter(t =>
        t.description.toLowerCase().includes(query) ||
        getCategoryName(t.categoryId).toLowerCase().includes(query)
    )
  }

  // Apply type filter
  if (filterType.value) {
    transactions = transactions.filter(t => t.type === filterType.value)
  }

  // Apply category filter
  if (filterCategory.value) {
    transactions = transactions.filter(t => t.categoryId === parseInt(filterCategory.value))
  }

  // Apply date range filter
  if (filterDateRange.value !== 'all') {
    const now = new Date()
    let startDate, endDate

    switch (filterDateRange.value) {
      case 'this-month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'last-month':
        const lastMonth = subMonths(now, 1)
        startDate = startOfMonth(lastMonth)
        endDate = endOfMonth(lastMonth)
        break
      case 'this-year':
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        break
    }

    if (startDate && endDate) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= startDate && transactionDate <= endDate
      })
    }
  }

  // Sort by date (newest first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date))

  return transactions
})

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage)
const endIndex = computed(() => startIndex.value + itemsPerPage)

const paginatedTransactions = computed(() => {
  return filteredTransactions.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1, '...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...', total)
    }
  }

  return pages.filter(page => page !== '...' || pages.indexOf(page) === pages.lastIndexOf(page))
})

// Helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
}

function formatDate(dateString) {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
}

function getCategoryName(categoryId) {
  const category = categoriesStore.getCategoryById(categoryId)
  return category ? category.name : 'Unknown Category'
}

// Handle type filter change - reset category when type changes
function handleTypeFilterChange() {
  // Only reset category if it doesn't match the new type
  if (filterCategory.value && filterType.value) {
    const selectedCategory = categoriesStore.getCategoryById(parseInt(filterCategory.value))
    if (selectedCategory && selectedCategory.type !== filterType.value) {
      filterCategory.value = '' // Reset category selection when type changes
    }
  }
  currentPage.value = 1 // Reset to first page
}

// Handle category filter change - update type based on selected category
function handleCategoryFilterChange() {
  if (filterCategory.value) {
    const selectedCategory = categoriesStore.getCategoryById(parseInt(filterCategory.value))
    if (selectedCategory && selectedCategory.type !== filterType.value) {
      filterType.value = selectedCategory.type
    }
  }
  currentPage.value = 1 // Reset to first page
}

// Modal functions
function openTransactionModal(transaction = null) {
  editingTransaction.value = transaction
  showTransactionModal.value = true
}

function closeTransactionModal() {
  showTransactionModal.value = false
  editingTransaction.value = null
}

function handleTransactionSuccess() {
  // Modal will close automatically
  // Data will update reactively
}

// CRUD functions
function editTransaction(transaction) {
  openTransactionModal(transaction)
}

function deleteTransaction(transaction) {
  deletingTransaction.value = transaction
  showDeleteModal.value = true
}

function confirmDelete() {
  if (deletingTransaction.value) {
    transactionsStore.deleteTransaction(deletingTransaction.value.id)
    showDeleteModal.value = false
    deletingTransaction.value = null
  }
}

function handleDateRangeChange() {
  currentPage.value = 1 // Reset to first page when filter changes
}

// Watch for filter changes and reset pagination
watch([searchQuery, filterType, filterCategory, filterDateRange], () => {
  currentPage.value = 1
})

// Initialize stores
onMounted(async () => {
  await categoriesStore.initCategories()

  // If superadmin viewing another user, pass their ID
  if (viewingUserId.value) {
    // We'll need to modify the transactions store to handle this
    await transactionsStore.initTransactions(null, viewingUserId.value)
  } else {
    await transactionsStore.initTransactions()
  }
})
</script>
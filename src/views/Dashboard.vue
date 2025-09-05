<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-1 text-sm text-gray-500">Overview of your financial status</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button
            @click="openTransactionModal()"
            class="btn-primary inline-flex items-center space-x-2"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Transaction</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Current Month Income</p>
            <p class="text-2xl font-bold text-green-600">${{ formatCurrency(currentMonthStats.income) }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Current Month Expenses</p>
            <p class="text-2xl font-bold text-red-600">${{ formatCurrency(currentMonthStats.expenses) }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Current Month Balance</p>
            <p :class="[
              'text-2xl font-bold',
              currentMonthStats.balance >= 0 ? 'text-green-600' : 'text-red-600'
            ]">
              ${{ formatCurrency(currentMonthStats.balance) }}
            </p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Total Transactions</p>
            <p class="text-2xl font-bold text-gray-900">{{ transactionsStore.transactionCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Monthly Trends Chart -->
      <MonthlyTrendsChart />

      <!-- Recent Transactions -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Recent Transactions</h3>
          <router-link
              to="/transactions"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </router-link>
        </div>
        <div class="space-y-3">
          <div v-if="recentTransactions.length === 0" class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="mt-2">No transactions yet</p>
            <p class="text-sm">Start tracking your finances by adding your first transaction</p>
          </div>

          <!-- Transaction List -->
          <div v-else class="space-y-3 max-h-80 overflow-y-auto">
            <div
                v-for="transaction in recentTransactions.slice(0, 5)"
                :key="transaction.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <div :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center',
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
                  <p class="text-sm font-medium text-gray-900">
                    {{ getCategoryName(transaction.categoryId) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(transaction.date) }}
                  </p>
                  <p v-if="transaction.description" class="text-xs text-gray-500 truncate max-w-48">
                    {{ transaction.description }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p :class="[
                  'text-sm font-medium',
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ transaction.type === 'income' ? '+' : '-' }}${{ formatCurrency(transaction.amount) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <CategoryBreakdownChart />

    <!-- Quick Actions -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
            @click="openTransactionModal()"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-900">Add Transaction</span>
        </button>

        <router-link
            to="/categories"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-900">Manage Categories</span>
        </router-link>

        <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-900">Generate Report</span>
        </button>

        <router-link
            to="/transactions"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-900">View All Transactions</span>
        </router-link>
      </div>
    </div>

    <!-- Transaction Modal -->
    <TransactionModal
        :is-open="showTransactionModal"
        :transaction="editingTransaction"
        @close="closeTransactionModal"
        @success="handleTransactionSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'
import TransactionModal from '@/components/Transaction/TransactionModal.vue'
import MonthlyTrendsChart from '@/components/Charts/MonthlyTrendsChart.vue'
import CategoryBreakdownChart from '@/components/Charts/CategoryBreakdownChart.vue'

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()

const showTransactionModal = ref(false)
const editingTransaction = ref(null)

// Computed properties
const currentMonthStats = computed(() => transactionsStore.currentMonthStats)
const recentTransactions = computed(() => transactionsStore.recentTransactions)

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

// Initialize stores
onMounted(() => {
  categoriesStore.initCategories()
  transactionsStore.initTransactions()
})
</script>
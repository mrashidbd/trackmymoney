<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">Category Breakdown</h3>
      <div class="flex space-x-2">
        <select v-model="selectedType" @change="updateChart"
                class="text-sm border border-gray-300 rounded-md px-3 py-1">
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
          <option value="both">Both</option>
        </select>
        <select v-model="selectedPeriod" @change="updateChart"
                class="text-sm border border-gray-300 rounded-md px-3 py-1">
          <option value="current-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="current-year">This Year</option>
          <option value="all-time">All Time</option>
        </select>
      </div>
    </div>

    <div v-if="hasData" class="h-80">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <div v-else class="h-80 flex items-center justify-center text-gray-500">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <p>No {{ selectedType }} data for {{ selectedPeriod.replace('-', ' ') }}</p>
      </div>
    </div>

    <!-- Category Legend -->
    <div v-if="hasData" class="mt-4">
      <!-- Legend header for 'both' type -->
      <div v-if="selectedType === 'both'" class="flex items-center space-x-4 mb-3 text-xs text-gray-500">
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Solid = Income</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-blue-500 bg-opacity-50 rounded-full"></div>
          <span>Translucent = Expense</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <div
            v-for="(item, index) in chartData"
            :key="`${item.categoryId}_${item.type || selectedType}`"
            class="flex items-center space-x-2 text-sm"
        >
          <div
              class="w-3 h-3 rounded-full flex-shrink-0"
              :style="{
              backgroundColor: selectedType === 'both'
                ? (item.type === 'income' ? colors[index % colors.length] : colors[index % colors.length] + '80')
                : colors[index % colors.length]
            }"
          ></div>
          <span class="text-gray-700 truncate">
            {{ item.name }}: ${{ formatCurrency(item.total) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {Chart, registerables} from 'chart.js'
import {startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, format} from 'date-fns'
import {useTransactionsStore} from '@/stores/transactions'
import {useCategoriesStore} from '@/stores/categories'

Chart.register(...registerables)

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()

const chartCanvas = ref(null)
let chartInstance = null
const selectedType = ref('expense')
const selectedPeriod = ref('current-month')

// Color palette for chart
const colors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#9ca3af'
]

const getDateRange = () => {
  const now = new Date()

  switch (selectedPeriod.value) {
    case 'current-month':
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd')
      }
    case 'last-month':
      const lastMonth = subMonths(now, 1)
      return {
        start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
      }
    case 'current-year':
      return {
        start: format(startOfYear(now), 'yyyy-MM-dd'),
        end: format(endOfYear(now), 'yyyy-MM-dd')
      }
    case 'all-time':
    default:
      return null
  }
}

const chartData = computed(() => {
  const dateRange = getDateRange()
  let categoryTotals = {}

  if (selectedType.value === 'both') {
    // Handle both income and expenses
    let filteredTransactions = transactionsStore.transactions

    if (dateRange) {
      filteredTransactions = transactionsStore.getTransactionsByDateRange(
          dateRange.start,
          dateRange.end
      )
    }

    filteredTransactions.forEach(transaction => {
      const categoryId = transaction.categoryId
      const category = categoriesStore.getCategoryById(categoryId)
      const categoryName = category ? category.name : 'Unknown Category'

      // Create unique key for category + type combination
      const key = `${categoryId}_${transaction.type}`

      if (!categoryTotals[key]) {
        categoryTotals[key] = {
          categoryId: categoryId,
          name: `${categoryName} (${transaction.type === 'income' ? 'Income' : 'Expense'})`,
          total: 0,
          type: transaction.type
        }
      }
      categoryTotals[key].total += transaction.amount
    })

    // Convert object to array for 'both' type
    return Object.values(categoryTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 15)
  } else {
    // Handle single type (income or expense)
    if (dateRange) {
      categoryTotals = transactionsStore.getCategoryBreakdown(
          selectedType.value,
          dateRange.start,
          dateRange.end
      )
    } else {
      const filteredTransactions = transactionsStore.transactions.filter(t => t.type === selectedType.value)
      filteredTransactions.forEach(transaction => {
        const categoryId = transaction.categoryId
        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = 0
        }
        categoryTotals[categoryId] += transaction.amount
      })
    }

    // Convert to array and add category names for single type
    const data = Object.entries(categoryTotals).map(([categoryId, total]) => {
      const category = categoriesStore.getCategoryById(parseInt(categoryId))
      return {
        categoryId: parseInt(categoryId),
        name: category ? category.name : 'Unknown Category',
        total: total,
        type: selectedType.value
      }
    })

    return data.sort((a, b) => b.total - a.total).slice(0, 10)
  }
})

const hasData = computed(() => chartData.value.length > 0)

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
}

const createChart = () => {
  if (!chartCanvas.value || !hasData.value) return

  const ctx = chartCanvas.value.getContext('2d')

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartData.value.map(item => item.name),
      datasets: [{
        data: chartData.value.map(item => item.total),
        backgroundColor: colors.slice(0, chartData.value.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          display: false // We'll show custom legend below
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const value = context.parsed
              const total = chartData.value.reduce((sum, item) => sum + item.total, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `$${value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const updateChart = async () => {
  destroyChart()
  await nextTick()
  setTimeout(() => {
    if (hasData.value) {
      createChart()
    }
  }, 50)
}

const destroyChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

// Watch for changes
watch([() => transactionsStore.transactions.length, selectedType, selectedPeriod], () => {
  updateChart()
})

onMounted(async () => {
  await nextTick()
  if (hasData.value) {
    createChart()
  }
})

onUnmounted(() => {
  destroyChart()
})
</script>
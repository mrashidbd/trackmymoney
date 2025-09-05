<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">Monthly Trends</h3>
      <select v-model="selectedYear" @change="updateChart" class="text-sm border border-gray-300 rounded-md px-3 py-1">
        <option v-for="year in availableYears" :key="year" :value="year">
          {{ year }}
        </option>
      </select>
    </div>
    <div class="h-80">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useTransactionsStore } from '@/stores/transactions'

Chart.register(...registerables)

const props = defineProps({
  height: {
    type: Number,
    default: 320
  }
})

const transactionsStore = useTransactionsStore()
const chartCanvas = ref(null)
let chartInstance = null
const selectedYear = ref(new Date().getFullYear())

// Get available years from transactions
const availableYears = ref([])

const updateAvailableYears = () => {
  const years = new Set()
  transactionsStore.transactions.forEach(transaction => {
    const year = new Date(transaction.date).getFullYear()
    years.add(year)
  })

  if (years.size === 0) {
    years.add(new Date().getFullYear())
  }

  availableYears.value = Array.from(years).sort((a, b) => b - a)

  // Set selected year to current year if available, otherwise first available year
  if (!availableYears.value.includes(selectedYear.value)) {
    selectedYear.value = availableYears.value[0]
  }
}

const createChart = () => {
  if (!chartCanvas.value) return

  const monthlyData = transactionsStore.getMonthlyData(selectedYear.value)

  const ctx = chartCanvas.value.getContext('2d')

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyData.map(data => data.month),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(data => data.income),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Expenses',
          data: monthlyData.map(data => data.expenses),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const value = context.parsed.y
              return `${context.dataset.label}: $${value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            },
            color: '#6b7280'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(107, 114, 128, 0.1)'
          },
          ticks: {
            font: {
              size: 11
            },
            color: '#6b7280',
            callback: function(value) {
              return '$' + value.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })
            }
          }
        }
      }
    }
  })
}

const updateChart = () => {
  if (chartInstance) {
    const monthlyData = transactionsStore.getMonthlyData(selectedYear.value)

    chartInstance.data.datasets[0].data = monthlyData.map(data => data.income)
    chartInstance.data.datasets[1].data = monthlyData.map(data => data.expenses)

    chartInstance.update('active')
  }
}

const destroyChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

// Watch for transaction changes
watch(() => transactionsStore.transactions.length, () => {
  updateAvailableYears()
  updateChart()
})

onMounted(() => {
  updateAvailableYears()
  createChart()
})

onUnmounted(() => {
  destroyChart()
})
</script>
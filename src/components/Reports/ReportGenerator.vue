<template>
  <div class="max-w-full overflow-hidden">
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Generate Financial Report</h3>
          <p class="text-sm text-gray-500 mt-1">Export your financial data as PDF or Excel</p>
        </div>
      </div>

      <form @submit.prevent="generateReport" class="space-y-6">
        <!-- Report Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="{ 'border-primary-500 bg-primary-50': reportForm.type === 'summary' }">
              <input v-model="reportForm.type" type="radio" value="summary" class="sr-only"/>
              <div class="flex items-center">
                <div class="w-4 h-4 border-2 rounded-full mr-3"
                     :class="{ 'border-primary-500 bg-primary-500': reportForm.type === 'summary', 'border-gray-300': reportForm.type !== 'summary' }">
                  <div v-if="reportForm.type === 'summary'" class="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                </div>
                <div>
                  <p class="text-sm font-medium">Summary Report</p>
                  <p class="text-xs text-gray-500">Overview with charts</p>
                </div>
              </div>
            </label>

            <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="{ 'border-primary-500 bg-primary-50': reportForm.type === 'detailed' }">
              <input v-model="reportForm.type" type="radio" value="detailed" class="sr-only"/>
              <div class="flex items-center">
                <div class="w-4 h-4 border-2 rounded-full mr-3"
                     :class="{ 'border-primary-500 bg-primary-500': reportForm.type === 'detailed', 'border-gray-300': reportForm.type !== 'detailed' }">
                  <div v-if="reportForm.type === 'detailed'" class="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                </div>
                <div>
                  <p class="text-sm font-medium">Detailed Report</p>
                  <p class="text-xs text-gray-500">All transactions</p>
                </div>
              </div>
            </label>

            <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                   :class="{ 'border-primary-500 bg-primary-50': reportForm.type === 'category' }">
              <input v-model="reportForm.type" type="radio" value="category" class="sr-only"/>
              <div class="flex items-center">
                <div class="w-4 h-4 border-2 rounded-full mr-3"
                     :class="{ 'border-primary-500 bg-primary-500': reportForm.type === 'category', 'border-gray-300': reportForm.type !== 'category' }">
                  <div v-if="reportForm.type === 'category'" class="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                </div>
                <div>
                  <p class="text-sm font-medium">Category Report</p>
                  <p class="text-xs text-gray-500">By categories</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Date Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <select v-model="reportForm.dateRange" @change="handleDateRangeChange" class="input-field">
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="current-year">Current Year</option>
                <option value="last-year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div v-if="reportForm.dateRange === 'custom'">
              <input v-model="reportForm.startDate" type="date" class="input-field" placeholder="Start Date"/>
            </div>
            <div v-if="reportForm.dateRange === 'custom'">
              <input v-model="reportForm.endDate" type="date" class="input-field" placeholder="End Date"/>
            </div>
          </div>
        </div>

        <!-- Export Format -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
                type="button"
                @click="exportToPDF"
                :disabled="isGenerating"
                class="flex items-center justify-center p-4 border-2 border-dashed border-red-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="text-center">
                <svg class="w-8 h-8 text-red-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="text-sm font-medium text-red-700">Export as PDF</span>
                <p class="text-xs text-red-600 mt-1">A4 format with charts</p>
              </div>
            </button>

            <button
                type="button"
                @click="exportToExcel"
                :disabled="isGenerating"
                class="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="text-center">
                <svg class="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="text-sm font-medium text-green-700">Export as Excel</span>
                <p class="text-xs text-green-600 mt-1">XLSX format</p>
              </div>
            </button>

            <button
                type="button"
                @click="exportToCSV"
                :disabled="isGenerating"
                class="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="text-center">
                <svg class="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="text-sm font-medium text-blue-700">Export as CSV</span>
                <p class="text-xs text-blue-600 mt-1">Spreadsheet format</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isGenerating" class="flex items-center justify-center py-8">
          <div class="flex items-center space-x-3">
            <svg class="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm text-gray-600">Generating report...</span>
          </div>
        </div>

        <!-- Report Preview Info -->
        <div v-if="!isGenerating && reportData" class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-900 mb-2">Report Preview</h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Period:</span>
              <p class="font-medium">{{ formatDateRange() }}</p>
            </div>
            <div>
              <span class="text-gray-500">Transactions:</span>
              <p class="font-medium">{{ reportData.transactions.length }}</p>
            </div>
            <div>
              <span class="text-gray-500">Total Income:</span>
              <p class="font-medium text-green-600">${{ formatCurrency(reportData.totalIncome) }}</p>
            </div>
            <div>
              <span class="text-gray-500">Total Expenses:</span>
              <p class="font-medium text-red-600">${{ formatCurrency(reportData.totalExpenses) }}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive, computed, onMounted, watch} from 'vue'
import {format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears} from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import {useTransactionsStore} from '@/stores/transactions'
import {useCategoriesStore} from '@/stores/categories'

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()

const isGenerating = ref(false)

const reportForm = reactive({
  type: 'summary',
  dateRange: 'current-month',
  startDate: '',
  endDate: ''
})

const reportData = ref(null)

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
}

const getDateRange = () => {
  const now = new Date()

  switch (reportForm.dateRange) {
    case 'current-month':
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
        label: `${format(now, 'MMMM yyyy')}`
      }
    case 'last-month':
      const lastMonth = subMonths(now, 1)
      return {
        start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        label: `${format(lastMonth, 'MMMM yyyy')}`
      }
    case 'current-year':
      return {
        start: format(startOfYear(now), 'yyyy-MM-dd'),
        end: format(endOfYear(now), 'yyyy-MM-dd'),
        label: `${format(now, 'yyyy')}`
      }
    case 'last-year':
      const lastYear = subYears(now, 1)
      return {
        start: format(startOfYear(lastYear), 'yyyy-MM-dd'),
        end: format(endOfYear(lastYear), 'yyyy-MM-dd'),
        label: `${format(lastYear, 'yyyy')}`
      }
    case 'custom':
      return {
        start: reportForm.startDate,
        end: reportForm.endDate,
        label: `${format(new Date(reportForm.startDate), 'MMM dd, yyyy')} - ${format(new Date(reportForm.endDate), 'MMM dd, yyyy')}`
      }
    default:
      return null
  }
}

const formatDateRange = () => {
  const range = getDateRange()
  return range ? range.label : 'Invalid range'
}

const generateReportData = () => {
  const dateRange = getDateRange()
  if (!dateRange) return null

  const transactions = transactionsStore.getTransactionsByDateRange(dateRange.start, dateRange.end)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  // Category breakdown
  const categoryBreakdown = {}
  transactions.forEach(transaction => {
    const category = categoriesStore.getCategoryById(transaction.categoryId)
    const categoryName = category ? category.name : 'Unknown Category'
    const key = `${categoryName}_${transaction.type}`

    if (!categoryBreakdown[key]) {
      categoryBreakdown[key] = {
        name: categoryName,
        type: transaction.type,
        total: 0,
        count: 0
      }
    }
    categoryBreakdown[key].total += transaction.amount
    categoryBreakdown[key].count++
  })

  return {
    dateRange,
    transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    categoryBreakdown: Object.values(categoryBreakdown)
  }
}

const handleDateRangeChange = () => {
  if (reportForm.dateRange === 'custom') {
    const now = new Date()
    reportForm.startDate = format(startOfMonth(now), 'yyyy-MM-dd')
    reportForm.endDate = format(endOfMonth(now), 'yyyy-MM-dd')
  }
  updateReportData()
}

const updateReportData = () => {
  reportData.value = generateReportData()
}

// Export functions
const exportToPDF = async () => {
  if (!reportData.value) return

  isGenerating.value = true

  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('Financial Report', 20, 25)

    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Period: ${reportData.value.dateRange.label}`, 20, 35)
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 42)

    // Summary section
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Summary', 20, 55)

    const summaryData = [
      ['Total Income', `$${formatCurrency(reportData.value.totalIncome)}`],
      ['Total Expenses', `$${formatCurrency(reportData.value.totalExpenses)}`],
      ['Net Balance', `$${formatCurrency(reportData.value.netBalance)}`],
      ['Total Transactions', reportData.value.transactions.length.toString()]
    ]

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value']],
      body: summaryData,
      margin: {left: 20, right: 20},
      styles: {fontSize: 10},
      headStyles: {fillColor: [22, 163, 74]}
    })

    // Category breakdown
    if (reportForm.type === 'category' || reportForm.type === 'summary') {
      doc.setFontSize(14)
      doc.text('Category Breakdown', 20, doc.lastAutoTable.finalY + 15)

      const categoryData = reportData.value.categoryBreakdown.map(cat => [
        cat.name,
        cat.type.charAt(0).toUpperCase() + cat.type.slice(1),
        cat.count.toString(),
        `$${formatCurrency(cat.total)}`
      ])

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Category', 'Type', 'Count', 'Amount']],
        body: categoryData,
        margin: {left: 20, right: 20},
        styles: {fontSize: 9},
        headStyles: {fillColor: [22, 163, 74]}
      })
    }

    // Detailed transactions
    if (reportForm.type === 'detailed') {
      doc.setFontSize(14)
      doc.text('Transactions', 20, doc.lastAutoTable.finalY + 15)

      const transactionData = reportData.value.transactions.map(t => {
        const category = categoriesStore.getCategoryById(t.categoryId)
        return [
          format(new Date(t.date), 'MMM dd, yyyy'),
          category ? category.name : 'Unknown',
          t.type.charAt(0).toUpperCase() + t.type.slice(1),
          `$${formatCurrency(t.amount)}`,
          t.description || '-'
        ]
      })

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Date', 'Category', 'Type', 'Amount', 'Description']],
        body: transactionData,
        margin: {left: 20, right: 20},
        styles: {fontSize: 8},
        headStyles: {fillColor: [22, 163, 74]},
        columnStyles: {
          4: {cellWidth: 40}
        }
      })
    }

    // Save PDF
    const fileName = `financial-report-${reportData.value.dateRange.start}-to-${reportData.value.dateRange.end}.pdf`
    doc.save(fileName)

  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Error generating PDF report')
  } finally {
    isGenerating.value = false
  }
}

const exportToExcel = () => {
  if (!reportData.value) return

  isGenerating.value = true

  try {
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ['Financial Report Summary'],
      ['Period:', reportData.value.dateRange.label],
      ['Generated:', format(new Date(), 'MMM dd, yyyy HH:mm')],
      [''],
      ['Metric', 'Value'],
      ['Total Income', reportData.value.totalIncome],
      ['Total Expenses', reportData.value.totalExpenses],
      ['Net Balance', reportData.value.netBalance],
      ['Total Transactions', reportData.value.transactions.length]
    ]

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Transactions sheet
    const transactionData = [
      ['Date', 'Category', 'Type', 'Amount', 'Description']
    ]

    reportData.value.transactions.forEach(t => {
      const category = categoriesStore.getCategoryById(t.categoryId)
      transactionData.push([
        format(new Date(t.date), 'MMM dd, yyyy HH:mm'),
        category ? category.name : 'Unknown',
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        t.amount,
        t.description || ''
      ])
    })

    const transactionWs = XLSX.utils.aoa_to_sheet(transactionData)
    XLSX.utils.book_append_sheet(wb, transactionWs, 'Transactions')

    // Category breakdown sheet
    const categoryData = [
      ['Category', 'Type', 'Transaction Count', 'Total Amount']
    ]

    reportData.value.categoryBreakdown.forEach(cat => {
      categoryData.push([
        cat.name,
        cat.type.charAt(0).toUpperCase() + cat.type.slice(1),
        cat.count,
        cat.total
      ])
    })

    const categoryWs = XLSX.utils.aoa_to_sheet(categoryData)
    XLSX.utils.book_append_sheet(wb, categoryWs, 'Categories')

    // Save Excel file
    const fileName = `financial-report-${reportData.value.dateRange.start}-to-${reportData.value.dateRange.end}.xlsx`
    XLSX.writeFile(wb, fileName)

  } catch (error) {
    console.error('Error generating Excel:', error)
    alert('Error generating Excel report')
  } finally {
    isGenerating.value = false
  }
}

const exportToCSV = () => {
  if (!reportData.value) return

  isGenerating.value = true

  try {
    const csvData = [
      ['Date', 'Category', 'Type', 'Amount', 'Description']
    ]

    reportData.value.transactions.forEach(t => {
      const category = categoriesStore.getCategoryById(t.categoryId)
      csvData.push([
        format(new Date(t.date), 'MMM dd, yyyy HH:mm'),
        category ? category.name : 'Unknown',
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        t.amount,
        `"${(t.description || '').replace(/"/g, '""')}"`
      ])
    })

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'})
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `financial-report-${reportData.value.dateRange.start}-to-${reportData.value.dateRange.end}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Error generating CSV:', error)
    alert('Error generating CSV report')
  } finally {
    isGenerating.value = false
  }
}

// Watch for changes
watch([() => reportForm.type, () => reportForm.dateRange, () => reportForm.startDate, () => reportForm.endDate], () => {
  updateReportData()
})

onMounted(() => {
  updateReportData()
})
</script>

<style scoped>
.card {
  max-width: 100%;
  overflow-x: auto;
}

.grid {
  min-width: 0;
}

.input-field, select {
  min-width: 0;
  width: 100%;
}
</style>
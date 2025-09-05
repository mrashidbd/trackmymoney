import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'

export const useTransactionsStore = defineStore('transactions', () => {
    const transactions = ref([])
    const isLoading = ref(false)

    // Computed properties for statistics
    const totalIncome = computed(() => {
        return transactions.value
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)
    })

    const totalExpenses = computed(() => {
        return transactions.value
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)
    })

    const netBalance = computed(() => {
        return totalIncome.value - totalExpenses.value
    })

    const transactionCount = computed(() => {
        return transactions.value.length
    })

    // Get transactions for current month
    const currentMonthTransactions = computed(() => {
        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        return transactions.value.filter(transaction => {
            const transactionDate = parseISO(transaction.date)
            return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd })
        })
    })

    // Current month statistics
    const currentMonthStats = computed(() => {
        const currentTransactions = currentMonthTransactions.value

        const income = currentTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)

        const expenses = currentTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)

        return {
            income,
            expenses,
            balance: income - expenses,
            count: currentTransactions.length
        }
    })

    // Recent transactions (last 10)
    const recentTransactions = computed(() => {
        return [...transactions.value]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
    })

    // Initialize transactions from localStorage
    function initTransactions() {
        const savedTransactions = localStorage.getItem('trackmymoney_transactions')
        if (savedTransactions) {
            transactions.value = JSON.parse(savedTransactions)
        }
    }

    // Save transactions to localStorage
    function saveTransactions() {
        localStorage.setItem('trackmymoney_transactions', JSON.stringify(transactions.value))
    }

    // Add new transaction
    function addTransaction(transactionData) {
        const newTransaction = {
            id: Date.now(), // Simple ID generation
            amount: parseFloat(transactionData.amount),
            date: transactionData.date,
            type: transactionData.type,
            categoryId: parseInt(transactionData.categoryId),
            description: transactionData.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        transactions.value.push(newTransaction)
        saveTransactions()
        return newTransaction
    }

    // Update transaction
    function updateTransaction(id, updateData) {
        const index = transactions.value.findIndex(t => t.id === id)
        if (index !== -1) {
            transactions.value[index] = {
                ...transactions.value[index],
                ...updateData,
                amount: parseFloat(updateData.amount),
                categoryId: parseInt(updateData.categoryId),
                updatedAt: new Date().toISOString()
            }
            saveTransactions()
            return transactions.value[index]
        }
        return null
    }

    // Delete transaction
    function deleteTransaction(id) {
        const index = transactions.value.findIndex(t => t.id === id)
        if (index !== -1) {
            transactions.value.splice(index, 1)
            saveTransactions()
            return { success: true, message: 'Transaction deleted successfully' }
        }
        return { success: false, message: 'Transaction not found' }
    }

    // Get transaction by ID
    function getTransactionById(id) {
        return transactions.value.find(t => t.id === id)
    }

    // Filter transactions by date range
    function getTransactionsByDateRange(startDate, endDate) {
        return transactions.value.filter(transaction => {
            const transactionDate = parseISO(transaction.date)
            return isWithinInterval(transactionDate, {
                start: parseISO(startDate),
                end: parseISO(endDate)
            })
        })
    }

    // Filter transactions by type
    function getTransactionsByType(type) {
        return transactions.value.filter(t => t.type === type)
    }

    // Filter transactions by category
    function getTransactionsByCategory(categoryId) {
        return transactions.value.filter(t => t.categoryId === categoryId)
    }

    // Search transactions
    function searchTransactions(query) {
        const searchTerm = query.toLowerCase()
        return transactions.value.filter(transaction =>
            transaction.description.toLowerCase().includes(searchTerm)
        )
    }

    // Get monthly data for charts
    function getMonthlyData(year = new Date().getFullYear()) {
        const monthlyData = Array.from({ length: 12 }, (_, month) => ({
            month: format(new Date(year, month), 'MMM'),
            income: 0,
            expenses: 0
        }))

        transactions.value.forEach(transaction => {
            const transactionDate = parseISO(transaction.date)
            if (transactionDate.getFullYear() === year) {
                const monthIndex = transactionDate.getMonth()
                if (transaction.type === 'income') {
                    monthlyData[monthIndex].income += transaction.amount
                } else {
                    monthlyData[monthIndex].expenses += transaction.amount
                }
            }
        })

        return monthlyData
    }

    // Get category breakdown
    function getCategoryBreakdown(type, startDate, endDate) {
        let filteredTransactions = transactions.value.filter(t => t.type === type)

        if (startDate && endDate) {
            filteredTransactions = getTransactionsByDateRange(startDate, endDate)
                .filter(t => t.type === type)
        }

        const categoryTotals = {}
        filteredTransactions.forEach(transaction => {
            const categoryId = transaction.categoryId
            if (!categoryTotals[categoryId]) {
                categoryTotals[categoryId] = 0
            }
            categoryTotals[categoryId] += transaction.amount
        })

        return categoryTotals
    }

    return {
        transactions,
        isLoading,
        totalIncome,
        totalExpenses,
        netBalance,
        transactionCount,
        currentMonthTransactions,
        currentMonthStats,
        recentTransactions,
        initTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionById,
        getTransactionsByDateRange,
        getTransactionsByType,
        getTransactionsByCategory,
        searchTransactions,
        getMonthlyData,
        getCategoryBreakdown
    }
})
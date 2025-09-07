import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import apiService from '@/services/api'
import offlineStorage from '@/services/offlineStorage'
import syncService from '@/services/syncService'

export const useTransactionsStore = defineStore('transactions', () => {
    const transactions = ref([])
    const isLoading = ref(false)
    const currentYear = ref(new Date().getFullYear())
    const isOnline = ref(navigator.onLine)

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

    // Set current year
    function setCurrentYear(year) {
        currentYear.value = year
    }

    // Get current user
    function getCurrentUser() {
        const userData = localStorage.getItem('trackmymoney_user')
        return userData ? JSON.parse(userData) : null
    }

    // Initialize transactions - hybrid approach
    async function initTransactions(year = null) {
        isLoading.value = true
        const user = getCurrentUser()
        const targetYear = year || currentYear.value

        try {
            if (!user?.user?.id) {
                console.error('No user found')
                return
            }

            // Always load from offline storage first (instant)
            const offlineTransactions = await offlineStorage.getTransactions(user.user.id, targetYear)
            transactions.value = offlineTransactions

            // If online, try to sync with server
            if (isOnline.value) {
                try {
                    await syncService.fullSync(user.user.id, targetYear)
                    // Reload from offline storage after sync
                    const syncedTransactions = await offlineStorage.getTransactions(user.user.id, targetYear)
                    transactions.value = syncedTransactions
                } catch (error) {
                    console.error('Sync failed, using offline data:', error)
                }
            }
        } catch (error) {
            console.error('Error initializing transactions:', error)
        } finally {
            isLoading.value = false
        }
    }

    // Add new transaction - hybrid approach
    async function addTransaction(transactionData) {
        const user = getCurrentUser()
        if (!user?.user?.id) {
            throw new Error('No user found')
        }

        try {
            // Save offline first
            const savedTransaction = await offlineStorage.saveTransaction(
                {
                    ...transactionData,
                    amount: parseFloat(transactionData.amount),
                    needsSync: true
                },
                user.user.id
            )

            // Add to local state immediately
            transactions.value.push(savedTransaction)

            // If online, try to sync immediately
            if (isOnline.value) {
                try {
                    const response = await apiService.createTransaction(transactionData)
                    if (response.success) {
                        // Update local storage with server data
                        const updatedTransaction = {
                            ...savedTransaction,
                            id: response.data.id,
                            localId: null,
                            needsSync: false,
                            serverUpdatedAt: response.data.updatedAt
                        }

                        await offlineStorage.db.transactions.put(updatedTransaction)

                        // Delete old local record if ID changed
                        if (savedTransaction.localId !== response.data.id) {
                            await offlineStorage.db.transactions.delete(savedTransaction.localId)
                        }

                        // Update local state
                        const index = transactions.value.findIndex(t =>
                            t.id === savedTransaction.id
                        )
                        if (index !== -1) {
                            transactions.value[index] = updatedTransaction
                        }
                    }
                } catch (error) {
                    console.error('Failed to sync transaction creation:', error)
                    // Transaction is saved offline, will sync later
                }
            }

            return savedTransaction
        } catch (error) {
            console.error('Error creating transaction:', error)
            throw error
        }
    }

    // Update transaction - hybrid approach
    async function updateTransaction(id, updateData) {
        const user = getCurrentUser()
        if (!user?.user?.id) {
            throw new Error('No user found')
        }

        try {
            // Update offline first
            const updatedTransaction = await offlineStorage.updateTransaction(
                id,
                updateData,
                user.user.id
            )

            if (updatedTransaction) {
                // Update local state
                const index = transactions.value.findIndex(t =>
                    t.id === id || t.localId === id
                )
                if (index !== -1) {
                    transactions.value[index] = updatedTransaction
                }

                // If online, try to sync immediately
                if (isOnline.value && updatedTransaction.id) {
                    try {
                        const response = await apiService.updateTransaction(
                            updatedTransaction.id,
                            updateData
                        )
                        if (response.success) {
                            // Update offline storage
                            await offlineStorage.db.transactions.put({
                                ...updatedTransaction,
                                ...response.data,
                                needsSync: false,
                                serverUpdatedAt: response.data.updatedAt
                            })

                            // Update local state
                            transactions.value[index] = { ...response.data, needsSync: false }
                        }
                    } catch (error) {
                        console.error('Failed to sync transaction update:', error)
                        // Update is saved offline, will sync later
                    }
                }

                return updatedTransaction
            }
            return null
        } catch (error) {
            console.error('Error updating transaction:', error)
            throw error
        }
    }

    // Delete transaction - hybrid approach
    async function deleteTransaction(id) {
        const user = getCurrentUser()
        if (!user?.user?.id) {
            throw new Error('No user found')
        }

        try {
            // Delete offline first
            const success = await offlineStorage.deleteTransaction(id, user.user.id)

            if (success) {
                // Remove from local state
                const index = transactions.value.findIndex(t =>
                    t.id === id || t.localId === id
                )
                if (index !== -1) {
                    transactions.value.splice(index, 1)
                }

                // If online, try to sync immediately
                if (isOnline.value) {
                    try {
                        const transaction = await offlineStorage.db.transactions.get(id)
                        if (transaction?.id && !transaction.localId) {
                            await apiService.deleteTransaction(transaction.id, currentYear.value)
                        }
                    } catch (error) {
                        console.error('Failed to sync transaction deletion:', error)
                        // Deletion is saved offline, will sync later
                    }
                }

                return { success: true, message: 'Transaction deleted successfully' }
            }
            return { success: false, message: 'Transaction not found' }
        } catch (error) {
            console.error('Error deleting transaction:', error)
            return { success: false, message: error.message || 'Failed to delete transaction' }
        }
    }

    // Get transaction by ID
    function getTransactionById(id) {
        return transactions.value.find(t => t.id === id || t.localId === id)
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
            (transaction.description || '').toLowerCase().includes(searchTerm)
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

    // Force sync
    async function forceSync() {
        const user = getCurrentUser()
        if (!user?.user?.id || !isOnline.value) {
            return { success: false, message: 'Cannot sync while offline' }
        }

        try {
            await syncService.fullSync(user.user.id, currentYear.value)
            // Reload transactions after sync
            await initTransactions()
            return { success: true, message: 'Sync completed successfully' }
        } catch (error) {
            console.error('Force sync failed:', error)
            return { success: false, message: error.message }
        }
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
        isOnline.value = true
        // Auto-sync when coming online
        const user = getCurrentUser()
        if (user?.user?.id) {
            syncService.backgroundSync(user.user.id, currentYear.value)
        }
    })

    window.addEventListener('offline', () => {
        isOnline.value = false
    })

    return {
        transactions,
        isLoading,
        currentYear,
        isOnline,
        totalIncome,
        totalExpenses,
        netBalance,
        transactionCount,
        currentMonthTransactions,
        currentMonthStats,
        recentTransactions,
        setCurrentYear,
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
        getCategoryBreakdown,
        forceSync
    }
})
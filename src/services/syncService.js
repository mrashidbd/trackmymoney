import apiService from './api'
import offlineStorage from './offlineStorage'

class SyncService {
    constructor() {
        this.isSyncing = false
        this.syncInProgress = new Set()
        this.lastSyncTime = null
        this.syncListeners = []
    }

    // Check if online
    isOnline() {
        return navigator.onLine
    }

    // Add sync event listener
    onSyncStatusChange(callback) {
        this.syncListeners.push(callback)
    }

    // Notify sync listeners
    notifySyncListeners(status) {
        this.syncListeners.forEach(callback => callback(status))
    }

    // Full sync - download server data and upload local changes
    async fullSync(userId, year) {
        if (this.isSyncing || !this.isOnline()) {
            return { success: false, message: 'Sync already in progress or offline' }
        }

        this.isSyncing = true
        this.notifySyncListeners({ status: 'syncing', progress: 0 })

        try {
            // Step 1: Download server data (50% progress)
            await this.downloadServerData(userId, year)
            this.notifySyncListeners({ status: 'syncing', progress: 50 })

            // Step 2: Upload local changes (100% progress)
            await this.uploadLocalChanges(userId, year)
            this.notifySyncListeners({ status: 'syncing', progress: 100 })

            this.lastSyncTime = new Date().toISOString()
            this.notifySyncListeners({ status: 'completed', lastSync: this.lastSyncTime })

            return { success: true, message: 'Sync completed successfully' }
        } catch (error) {
            console.error('Sync failed:', error)
            this.notifySyncListeners({ status: 'error', error: error.message })
            return { success: false, message: error.message }
        } finally {
            this.isSyncing = false
        }
    }

    // Download server data and merge with local
    async downloadServerData(userId, year) {
        try {
            // Download categories
            const categoriesResponse = await apiService.getCategories(year)
            if (categoriesResponse.success) {
                for (const serverCategory of categoriesResponse.data) {
                    await this.mergeServerCategory(serverCategory, userId, year)
                }
            }

            // Download transactions
            const transactionsResponse = await apiService.getTransactions(year)
            if (transactionsResponse.success) {
                for (const serverTransaction of transactionsResponse.data) {
                    await this.mergeServerTransaction(serverTransaction, userId)
                }
            }
        } catch (error) {
            console.error('Error downloading server data:', error)
            throw error
        }
    }

    // Merge server category with local data
    async mergeServerCategory(serverCategory, userId, year) {
        const localCategory = await offlineStorage.db.categories
            .where('id')
            .equals(serverCategory.id)
            .first()

        if (!localCategory) {
            // New category from server
            await offlineStorage.saveCategory({
                ...serverCategory,
                needsSync: false,
                serverUpdatedAt: serverCategory.updatedAt
            }, userId, year)
        } else {
            // Check if server version is newer
            const serverTime = new Date(serverCategory.updatedAt).getTime()
            const localTime = new Date(localCategory.updatedAt).getTime()

            if (serverTime > localTime && !localCategory.needsSync) {
                // Server version is newer and no local changes
                await offlineStorage.saveCategory({
                    ...localCategory,
                    ...serverCategory,
                    needsSync: false,
                    serverUpdatedAt: serverCategory.updatedAt
                }, userId, year)
            }
            // If local has changes (needsSync: true), keep local version for upload
        }
    }

    // Merge server transaction with local data
    async mergeServerTransaction(serverTransaction, userId) {
        const localTransaction = await offlineStorage.db.transactions
            .where('id')
            .equals(serverTransaction.id)
            .first()

        if (!localTransaction) {
            // New transaction from server
            await offlineStorage.saveTransaction({
                ...serverTransaction,
                needsSync: false,
                serverUpdatedAt: serverTransaction.updatedAt
            }, userId)
        } else {
            // Check if server version is newer
            const serverTime = new Date(serverTransaction.updatedAt).getTime()
            const localTime = new Date(localTransaction.updatedAt).getTime()

            if (serverTime > localTime && !localTransaction.needsSync) {
                // Server version is newer and no local changes
                await offlineStorage.saveTransaction({
                    ...localTransaction,
                    ...serverTransaction,
                    needsSync: false,
                    serverUpdatedAt: serverTransaction.updatedAt
                }, userId)
            }
            // If local has changes (needsSync: true), keep local version for upload
        }
    }

    // Upload local changes to server
    async uploadLocalChanges(userId, year) {
        try {
            // Upload categories
            await this.uploadUnsyncedCategories(userId, year)

            // Upload transactions
            await this.uploadUnsyncedTransactions(userId, year)
        } catch (error) {
            console.error('Error uploading local changes:', error)
            throw error
        }
    }

    // Upload unsynced categories
    async uploadUnsyncedCategories(userId, year) {
        const unsyncedCategories = await offlineStorage.getUnsyncedCategories(userId, year)

        for (const category of unsyncedCategories) {
            try {
                if (category.deleted) {
                    // Delete on server
                    if (category.id && !category.localId) {
                        await apiService.deleteCategory(category.id, year)
                    }
                    // Remove from local storage
                    await offlineStorage.db.categories.delete(category.id || category.localId)
                } else if (category.localId && !category.id) {
                    // Create new category on server
                    const response = await apiService.createCategory({
                        name: category.name,
                        type: category.type
                    }, year)

                    if (response.success) {
                        await offlineStorage.markCategorySynced(category.localId, response.data.id, response.data)
                    }
                } else if (category.id) {
                    // Update existing category on server
                    const response = await apiService.updateCategory(category.id, {
                        name: category.name
                    }, year)

                    if (response.success) {
                        await offlineStorage.db.categories.put({
                            ...category,
                            ...response.data,
                            needsSync: false,
                            serverUpdatedAt: response.data.updatedAt
                        })
                    }
                }
            } catch (error) {
                console.error(`Error syncing category ${category.name}:`, error)
                // Continue with other categories
            }
        }
    }

    // Upload unsynced transactions
    async uploadUnsyncedTransactions(userId, year) {
        const unsyncedTransactions = await offlineStorage.getUnsyncedTransactions(userId, year)

        for (const transaction of unsyncedTransactions) {
            try {
                if (transaction.deleted) {
                    // Delete on server
                    if (transaction.id && !transaction.localId) {
                        await apiService.deleteTransaction(transaction.id, year)
                    }
                    // Remove from local storage
                    await offlineStorage.db.transactions.delete(transaction.id || transaction.localId)
                } else if (transaction.localId && !transaction.id) {
                    // Create new transaction on server
                    const response = await apiService.createTransaction({
                        amount: transaction.amount,
                        date: transaction.date,
                        type: transaction.type,
                        categoryId: transaction.categoryId,
                        description: transaction.description
                    })

                    if (response.success) {
                        await offlineStorage.markTransactionSynced(transaction.localId, response.data.id, response.data)
                    }
                } else if (transaction.id) {
                    // Update existing transaction on server
                    const response = await apiService.updateTransaction(transaction.id, {
                        amount: transaction.amount,
                        date: transaction.date,
                        type: transaction.type,
                        categoryId: transaction.categoryId,
                        description: transaction.description
                    })

                    if (response.success) {
                        await offlineStorage.db.transactions.put({
                            ...transaction,
                            ...response.data,
                            needsSync: false,
                            serverUpdatedAt: response.data.updatedAt
                        })
                    }
                }
            } catch (error) {
                console.error(`Error syncing transaction ${transaction.id}:`, error)
                // Continue with other transactions
            }
        }
    }

    // Background sync - triggered when coming online
    async backgroundSync(userId, year) {
        if (!this.isOnline() || this.isSyncing) {
            return
        }

        try {
            await this.fullSync(userId, year)
        } catch (error) {
            console.error('Background sync failed:', error)
        }
    }

    // Quick sync - only upload critical changes
    async quickSync(userId, year) {
        if (!this.isOnline() || this.isSyncing) {
            return { success: false, message: 'Cannot sync while offline' }
        }

        try {
            await this.uploadLocalChanges(userId, year)
            return { success: true, message: 'Quick sync completed' }
        } catch (error) {
            console.error('Quick sync failed:', error)
            return { success: false, message: error.message }
        }
    }

    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline(),
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime
        }
    }

    // Initialize sync service
    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('App came online')
            const user = JSON.parse(localStorage.getItem('trackmymoney_user') || '{}')
            if (user.user?.id) {
                this.backgroundSync(user.user.id, new Date().getFullYear())
            }
        })

        window.addEventListener('offline', () => {
            console.log('App went offline')
            this.notifySyncListeners({ status: 'offline' })
        })
    }
}

export default new SyncService()
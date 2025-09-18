import apiService from './api'
import offlineStorage from './offlineStorage'

class SyncService {
    constructor() {
        this.isSyncing = false
        this.syncInProgress = new Set()
        this.lastSyncTime = null
        this.syncListeners = []
        this.retryQueue = []
        this.maxRetries = 3
        this.retryDelay = 1000 // Start with 1 second
    }

    // Check if online with fallback
    isOnline() {
        return navigator.onLine && this.hasNetworkAccess()
    }

    // Additional network connectivity check
    async hasNetworkAccess() {
        try {
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 5000
            })
            return response.ok
        } catch {
            return false
        }
    }

    // Add sync event listener
    onSyncStatusChange(callback) {
        if (typeof callback === 'function') {
            this.syncListeners.push(callback)
        }
    }

    // Remove sync listener
    removeSyncStatusListener(callback) {
        this.syncListeners = this.syncListeners.filter(listener => listener !== callback)
    }

    // Notify sync listeners with error handling
    notifySyncListeners(status) {
        this.syncListeners.forEach(callback => {
            try {
                callback(status)
            } catch (error) {
                console.error('Error in sync listener:', error)
            }
        })
    }

    // Full sync with improved error handling and retry logic
    async fullSync(userId, year, retryCount = 0) {
        const syncKey = `${userId}_${year}`

        if (this.isSyncing || this.syncInProgress.has(syncKey)) {
            return {
                success: false,
                message: 'Sync already in progress',
                code: 'SYNC_IN_PROGRESS'
            }
        }

        if (!await this.isOnline()) {
            return {
                success: false,
                message: 'No network connection available',
                code: 'OFFLINE'
            }
        }

        this.isSyncing = true
        this.syncInProgress.add(syncKey)
        this.notifySyncListeners({
            status: 'syncing',
            progress: 0,
            userId,
            year
        })

        try {
            // Step 1: Download server data (40% progress)
            await this.downloadServerData(userId, year)
            this.notifySyncListeners({
                status: 'syncing',
                progress: 40,
                userId,
                year
            })

            // Step 2: Upload local changes (80% progress)
            await this.uploadLocalChanges(userId, year)
            this.notifySyncListeners({
                status: 'syncing',
                progress: 80,
                userId,
                year
            })

            // Step 3: Final validation (100% progress)
            await this.validateSyncIntegrity(userId, year)
            this.notifySyncListeners({
                status: 'syncing',
                progress: 100,
                userId,
                year
            })

            this.lastSyncTime = new Date().toISOString()
            this.notifySyncListeners({
                status: 'completed',
                lastSync: this.lastSyncTime,
                userId,
                year
            })

            // Clear retry queue on success
            this.retryQueue = this.retryQueue.filter(item => item.key !== syncKey)

            return {
                success: true,
                message: 'Sync completed successfully',
                code: 'SYNC_SUCCESS',
                lastSync: this.lastSyncTime
            }
        } catch (error) {
            console.error('Sync failed:', error)

            // Handle different types of errors
            let errorMessage = 'Sync failed'
            let errorCode = 'SYNC_ERROR'
            let shouldRetry = false

            if (error.name === 'NetworkError' || !navigator.onLine) {
                errorMessage = 'Network error - will retry when connection is restored'
                errorCode = 'NETWORK_ERROR'
                shouldRetry = true
            } else if (error.status === 401) {
                errorMessage = 'Authentication expired - please log in again'
                errorCode = 'AUTH_EXPIRED'
                shouldRetry = false
            } else if (error.status === 429) {
                errorMessage = 'Too many requests - sync will retry automatically'
                errorCode = 'RATE_LIMITED'
                shouldRetry = true
            } else if (error.status >= 500) {
                errorMessage = 'Server error - will retry automatically'
                errorCode = 'SERVER_ERROR'
                shouldRetry = true
            } else if (error.status >= 400) {
                errorMessage = 'Client error - please check your data'
                errorCode = 'CLIENT_ERROR'
                shouldRetry = false
            }

            // Retry logic for recoverable errors
            if (shouldRetry && retryCount < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, retryCount) // Exponential backoff
                console.log(`Retrying sync in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`)

                setTimeout(() => {
                    this.fullSync(userId, year, retryCount + 1)
                }, delay)

                return {
                    success: false,
                    message: `${errorMessage} (retry ${retryCount + 1}/${this.maxRetries})`,
                    code: errorCode,
                    retrying: true
                }
            }

            // Add to retry queue for later
            if (shouldRetry) {
                this.addToRetryQueue(syncKey, userId, year)
            }

            this.notifySyncListeners({
                status: 'error',
                error: errorMessage,
                code: errorCode,
                userId,
                year
            })

            return {
                success: false,
                message: errorMessage,
                code: errorCode
            }
        } finally {
            this.isSyncing = false
            this.syncInProgress.delete(syncKey)
        }
    }

    // Add failed sync to retry queue
    addToRetryQueue(key, userId, year) {
        const existing = this.retryQueue.find(item => item.key === key)
        if (!existing) {
            this.retryQueue.push({
                key,
                userId,
                year,
                attempts: 0,
                lastAttempt: Date.now()
            })
        }
    }

    // Process retry queue
    async processRetryQueue() {
        if (this.retryQueue.length === 0 || !await this.isOnline()) {
            return
        }

        const now = Date.now()
        const toRetry = this.retryQueue.filter(item => {
            const timeSinceLastAttempt = now - item.lastAttempt
            const minDelay = this.retryDelay * Math.pow(2, item.attempts)
            return timeSinceLastAttempt >= minDelay
        })

        for (const item of toRetry) {
            if (item.attempts >= this.maxRetries) {
                // Remove from queue after max retries
                this.retryQueue = this.retryQueue.filter(queueItem => queueItem.key !== item.key)
                continue
            }

            item.attempts++
            item.lastAttempt = now

            try {
                const result = await this.fullSync(item.userId, item.year)
                if (result.success) {
                    // Remove from queue on success
                    this.retryQueue = this.retryQueue.filter(queueItem => queueItem.key !== item.key)
                }
            } catch (error) {
                console.error(`Retry failed for ${item.key}:`, error)
            }
        }
    }

    // Download server data with conflict resolution
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

    // Merge server category with improved conflict resolution
    async mergeServerCategory(serverCategory, userId, year) {
        try {
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
                // Conflict resolution based on timestamps
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
                } else if (localCategory.needsSync && serverTime > (localCategory.serverUpdatedAt ? new Date(localCategory.serverUpdatedAt).getTime() : 0)) {
                    // Both have changes - mark for manual resolution
                    console.warn(`Conflict detected for category ${serverCategory.name}`)
                    // For now, keep local changes and sync them
                }
            }
        } catch (error) {
            console.error('Error merging server category:', error)
            throw error
        }
    }

    // Merge server transaction with improved conflict resolution
    async mergeServerTransaction(serverTransaction, userId) {
        try {
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
                // Conflict resolution
                const serverTime = new Date(serverTransaction.updatedAt).getTime()
                const localTime = new Date(localTransaction.updatedAt).getTime()

                if (serverTime > localTime && !localTransaction.needsSync) {
                    // Server version is newer
                    await offlineStorage.saveTransaction({
                        ...localTransaction,
                        ...serverTransaction,
                        needsSync: false,
                        serverUpdatedAt: serverTransaction.updatedAt
                    }, userId)
                } else if (localTransaction.needsSync && serverTime > (localTransaction.serverUpdatedAt ? new Date(localTransaction.serverUpdatedAt).getTime() : 0)) {
                    // Both have changes
                    console.warn(`Conflict detected for transaction ${serverTransaction.id}`)
                    // Keep local changes for now
                }
            }
        } catch (error) {
            console.error('Error merging server transaction:', error)
            throw error
        }
    }

    // Upload local changes with better error handling
    async uploadLocalChanges(userId, year) {
        try {
            // Upload categories first (transactions depend on categories)
            await this.uploadUnsyncedCategories(userId, year)

            // Then upload transactions
            await this.uploadUnsyncedTransactions(userId, year)
        } catch (error) {
            console.error('Error uploading local changes:', error)
            throw error
        }
    }

    // Upload unsynced categories with retry logic
    async uploadUnsyncedCategories(userId, year) {
        const unsyncedCategories = await offlineStorage.getUnsyncedCategories(userId, year)
        const errors = []

        for (const category of unsyncedCategories) {
            try {
                if (category.deleted) {
                    // Delete on server (only if it has a real server ID)
                    if (category.id && !category.localId) {
                        await apiService.deleteCategory(category.id, year)
                    }
                    // Remove from local storage
                    await offlineStorage.db.categories.delete(category.id)
                } else if (category.localId) {
                    // Create new category on server
                    const response = await apiService.createCategory({
                        name: category.name,
                        type: category.type
                    }, year)

                    if (response.success) {
                        // Update the local record with server ID
                        await offlineStorage.db.categories.put({
                            ...category,
                            id: response.data.id,
                            localId: null,
                            needsSync: false,
                            serverUpdatedAt: response.data.updatedAt
                        })

                        // Delete the old local record if different ID
                        if (category.localId !== response.data.id) {
                            await offlineStorage.db.categories.delete(category.localId)
                        }
                    }
                } else {
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
                errors.push({ category: category.name, error: error.message })
                // Continue with other categories
            }
        }

        if (errors.length > 0) {
            console.warn('Some categories failed to sync:', errors)
        }
    }

    // Upload unsynced transactions with retry logic
    async uploadUnsyncedTransactions(userId, year) {
        const unsyncedTransactions = await offlineStorage.getUnsyncedTransactions(userId, year)
        const errors = []

        for (const transaction of unsyncedTransactions) {
            try {
                if (transaction.deleted) {
                    // Delete on server (only if it has a real server ID)
                    if (transaction.id && !transaction.localId) {
                        await apiService.deleteTransaction(transaction.id, year)
                    }
                    // Remove from local storage
                    await offlineStorage.db.transactions.delete(transaction.id)
                } else if (transaction.localId) {
                    // Create new transaction on server
                    const response = await apiService.createTransaction({
                        amount: transaction.amount,
                        date: transaction.date,
                        type: transaction.type,
                        categoryId: transaction.categoryId,
                        description: transaction.description
                    })

                    if (response.success) {
                        // Update the local record with server ID
                        await offlineStorage.db.transactions.put({
                            ...transaction,
                            id: response.data.id,
                            localId: null,
                            needsSync: false,
                            serverUpdatedAt: response.data.updatedAt
                        })

                        // Delete the old local record if different ID
                        if (transaction.localId !== response.data.id) {
                            await offlineStorage.db.transactions.delete(transaction.localId)
                        }
                    }
                } else {
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
                errors.push({ transaction: transaction.id, error: error.message })
                // Continue with other transactions
            }
        }

        if (errors.length > 0) {
            console.warn('Some transactions failed to sync:', errors)
        }
    }

    // Validate sync integrity
    async validateSyncIntegrity(userId, year) {
        try {
            // Check for any remaining unsynced items
            const unsyncedCategories = await offlineStorage.getUnsyncedCategories(userId, year)
            const unsyncedTransactions = await offlineStorage.getUnsyncedTransactions(userId, year)

            if (unsyncedCategories.length > 0 || unsyncedTransactions.length > 0) {
                console.warn('Sync incomplete - some items still need syncing', {
                    categories: unsyncedCategories.length,
                    transactions: unsyncedTransactions.length
                })
                throw new Error('Sync validation failed - unsynced items remain')
            }

            // Additional integrity checks could go here
            // e.g., verify data consistency, check for orphaned records, etc.

        } catch (error) {
            console.error('Sync integrity validation failed:', error)
            throw error
        }
    }

    // Background sync - triggered when coming online
    async backgroundSync(userId, year) {
        if (!await this.isOnline() || this.isSyncing) {
            return
        }

        try {
            // Process retry queue first
            await this.processRetryQueue()

            // Then do a full sync
            await this.fullSync(userId, year)
        } catch (error) {
            console.error('Background sync failed:', error)
        }
    }

    // Quick sync - only upload critical changes
    async quickSync(userId, year) {
        if (!await this.isOnline() || this.isSyncing) {
            return {
                success: false,
                message: 'Cannot sync while offline or sync in progress',
                code: 'SYNC_UNAVAILABLE'
            }
        }

        try {
            this.notifySyncListeners({ status: 'quick-sync', userId, year })

            await this.uploadLocalChanges(userId, year)

            this.notifySyncListeners({ status: 'quick-sync-completed', userId, year })

            return {
                success: true,
                message: 'Quick sync completed',
                code: 'QUICK_SYNC_SUCCESS'
            }
        } catch (error) {
            console.error('Quick sync failed:', error)
            this.notifySyncListeners({ status: 'error', error: error.message, userId, year })

            return {
                success: false,
                message: error.message,
                code: 'QUICK_SYNC_FAILED'
            }
        }
    }

    // Get sync status with more details
    getSyncStatus() {
        return {
            isOnline: navigator.onLine,
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            syncInProgress: Array.from(this.syncInProgress),
            retryQueueSize: this.retryQueue.length,
            pendingRetries: this.retryQueue.map(item => ({
                key: item.key,
                attempts: item.attempts,
                maxRetries: this.maxRetries
            }))
        }
    }

    // Clear sync data
    clearSyncData() {
        this.isSyncing = false
        this.syncInProgress.clear()
        this.retryQueue = []
        this.lastSyncTime = null
    }

    // Initialize sync service
    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('App came online - starting background sync')
            this.notifySyncListeners({ status: 'online' })

            const user = JSON.parse(localStorage.getItem('trackmymoney_user') || '{}')
            if (user.user?.id) {
                // Small delay to ensure connection is stable
                setTimeout(() => {
                    this.backgroundSync(user.user.id, new Date().getFullYear())
                }, 1000)
            }
        })

        window.addEventListener('offline', () => {
            console.log('App went offline')
            this.notifySyncListeners({ status: 'offline' })
        })

        // Process retry queue periodically
        setInterval(() => {
            if (this.retryQueue.length > 0) {
                this.processRetryQueue()
            }
        }, 30000) // Every 30 seconds

        // Clear expired sync data periodically
        setInterval(() => {
            this.clearExpiredSyncData()
        }, 300000) // Every 5 minutes
    }

    // Clear expired sync data
    clearExpiredSyncData() {
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        const now = Date.now()

        this.retryQueue = this.retryQueue.filter(item => {
            return (now - item.lastAttempt) < maxAge
        })
    }

    // Cleanup resources
    destroy() {
        this.syncListeners = []
        this.clearSyncData()

        // Remove event listeners
        window.removeEventListener('online', this.backgroundSync)
        window.removeEventListener('offline', () => {})
    }
}

export default new SyncService()
import Dexie from 'dexie'

class OfflineStorageService {
    constructor() {
        this.db = new Dexie('TrackMyMoneyDB')
        this.initDatabase()
    }

    initDatabase() {
        // Single clean version without compound indexes
        this.db.version(1).stores({
            users: 'id, username, name, token, lastSync',
            categories: 'id, name, type, isDefault, year, userId, localId, needsSync, deleted, createdAt, updatedAt, serverUpdatedAt',
            transactions: 'id, amount, date, type, categoryId, description, year, userId, localId, needsSync, deleted, createdAt, updatedAt, serverUpdatedAt',
            syncQueue: '++id, type, action, data, timestamp, retryCount'
        })
    }

    // Generate local ID for offline-created items
    generateLocalId() {
        return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // User methods
    async saveUser(userData) {
        const user = {
            id: userData.user.id,
            username: userData.user.username,
            name: userData.user.name,
            token: userData.token,
            lastSync: new Date().toISOString()
        }
        await this.db.users.put(user)
        return user
    }

    async getUser() {
        const users = await this.db.users.toArray()
        return users.length > 0 ? users[0] : null
    }

    async clearUser() {
        await this.db.users.clear()
    }

    // Categories methods
    async getCategories(userId, year) {
        try {
            const allCategories = await this.db.categories.toArray()
            return allCategories.filter(cat =>
                cat.userId === userId &&
                cat.year === year &&
                cat.deleted === false
            )
        } catch (error) {
            console.error('Error getting categories:', error)
            return []
        }
    }

    async saveCategory(category, userId, year) {
        const categoryData = {
            ...category,
            userId,
            year,
            deleted: false,
            needsSync: category.needsSync !== false, // Default to true unless explicitly false
            localId: category.localId || (category.id ? null : this.generateLocalId()),
            updatedAt: new Date().toISOString()
        }

        if (!categoryData.createdAt) {
            categoryData.createdAt = categoryData.updatedAt
        }

        await this.db.categories.put(categoryData)
        return categoryData
    }

    async updateCategory(id, updates, userId, year) {
        const category = await this.db.categories.get(id)
        if (category && category.userId === userId && category.year === year) {
            const updatedCategory = {
                ...category,
                ...updates,
                needsSync: true,
                updatedAt: new Date().toISOString()
            }
            await this.db.categories.put(updatedCategory)
            return updatedCategory
        }
        return null
    }

    async deleteCategory(id, userId, year) {
        const category = await this.db.categories.get(id)
        if (category && category.userId === userId && category.year === year) {
            if (category.localId && !category.id) {
                // If it's a local-only category, delete permanently
                await this.db.categories.delete(id)
            } else {
                // Mark for deletion sync
                await this.db.categories.put({
                    ...category,
                    deleted: true,
                    needsSync: true,
                    updatedAt: new Date().toISOString()
                })
            }
            return true
        }
        return false
    }

    // Transactions methods
    async getTransactions(userId, year) {
        try {
            const allTransactions = await this.db.transactions.toArray()
            return allTransactions.filter(trans =>
                trans.userId === userId &&
                trans.year === year &&
                trans.deleted === false
            )
        } catch (error) {
            console.error('Error getting transactions:', error)
            return []
        }
    }

    async saveTransaction(transaction, userId) {
        const year = new Date(transaction.date).getFullYear()
        const transactionData = {
            ...transaction,
            userId,
            year,
            deleted: false,
            needsSync: transaction.needsSync !== false,
            localId: transaction.localId || (transaction.id ? null : this.generateLocalId()),
            updatedAt: new Date().toISOString()
        }

        if (!transactionData.createdAt) {
            transactionData.createdAt = transactionData.updatedAt
        }

        await this.db.transactions.put(transactionData)
        return transactionData
    }

    async updateTransaction(id, updates, userId) {
        const transaction = await this.db.transactions.get(id)
        if (transaction && transaction.userId === userId) {
            const year = new Date(updates.date || transaction.date).getFullYear()
            const updatedTransaction = {
                ...transaction,
                ...updates,
                year,
                needsSync: true,
                updatedAt: new Date().toISOString()
            }
            await this.db.transactions.put(updatedTransaction)
            return updatedTransaction
        }
        return null
    }

    async deleteTransaction(id, userId) {
        const transaction = await this.db.transactions.get(id)
        if (transaction && transaction.userId === userId) {
            if (transaction.localId && !transaction.id) {
                // If it's a local-only transaction, delete permanently
                await this.db.transactions.delete(id)
            } else {
                // Mark for deletion sync
                await this.db.transactions.put({
                    ...transaction,
                    deleted: true,
                    needsSync: true,
                    updatedAt: new Date().toISOString()
                })
            }
            return true
        }
        return false
    }

    // Sync queue methods
    async addToSyncQueue(type, action, data) {
        await this.db.syncQueue.add({
            type, // 'category' or 'transaction'
            action, // 'create', 'update', 'delete'
            data,
            timestamp: new Date().toISOString(),
            retryCount: 0
        })
    }

    async getSyncQueue() {
        return await this.db.syncQueue.orderBy('timestamp').toArray()
    }

    async removeSyncQueueItem(id) {
        await this.db.syncQueue.delete(id)
    }

    async clearSyncQueue() {
        await this.db.syncQueue.clear()
    }

    // Get items that need sync
// Replace getUnsyncedCategories method
    async getUnsyncedCategories(userId, year) {
        try {
            const allCategories = await this.db.categories.toArray()
            return allCategories.filter(cat =>
                cat.userId === userId &&
                cat.year === year &&
                cat.needsSync === true
            )
        } catch (error) {
            console.error('Error getting unsynced categories:', error)
            return []
        }
    }

// Replace getUnsyncedTransactions method
    async getUnsyncedTransactions(userId, year) {
        try {
            const allTransactions = await this.db.transactions.toArray()
            return allTransactions.filter(trans =>
                trans.userId === userId &&
                trans.year === year &&
                trans.needsSync === true
            )
        } catch (error) {
            console.error('Error getting unsynced transactions:', error)
            return []
        }
    }

    // Mark items as synced
    async markCategorySynced(localId, serverId, serverData) {
        const category = await this.db.categories.where('localId').equals(localId).first()
        if (category) {
            await this.db.categories.put({
                ...category,
                ...serverData,
                id: serverId,
                needsSync: false,
                serverUpdatedAt: serverData.updatedAt
            })
        }
    }

    async markTransactionSynced(localId, serverId, serverData) {
        const transaction = await this.db.transactions.where('localId').equals(localId).first()
        if (transaction) {
            await this.db.transactions.put({
                ...transaction,
                ...serverData,
                id: serverId,
                needsSync: false,
                serverUpdatedAt: serverData.updatedAt
            })
        }
    }

    // Clear all data (for logout)
    async clearAllData() {
        await this.db.categories.clear()
        await this.db.transactions.clear()
        await this.db.syncQueue.clear()
        await this.db.users.clear()
    }

    // Get database statistics - completely safe version
    async getStats() {
        try {
            // Use toArray() instead of count() to avoid index issues
            const allCategories = await this.db.categories.toArray()
            const allTransactions = await this.db.transactions.toArray()

            // Count unsynced items manually
            const unsyncedCategories = allCategories.filter(cat => cat.needsSync === true).length
            const unsyncedTransactions = allTransactions.filter(trans => trans.needsSync === true).length

            return {
                categoriesCount: allCategories.length,
                transactionsCount: allTransactions.length,
                unsyncedItems: unsyncedCategories + unsyncedTransactions
            }
        } catch (error) {
            console.error('Error getting stats:', error)
            // Return empty stats if any error occurs
            return {
                categoriesCount: 0,
                transactionsCount: 0,
                unsyncedItems: 0
            }
        }
    }

    // Development helper - clear and reinitialize database
    async resetDatabase() {
        try {
            // Close current database
            if (this.db.isOpen()) {
                this.db.close()
            }

            // Delete the entire database
            await Dexie.delete('TrackMyMoneyDB')

            // Recreate with clean schema
            this.db = new Dexie('TrackMyMoneyDB')
            this.initDatabase()

            console.log('Database reset successfully')
            return true
        } catch (error) {
            console.error('Error resetting database:', error)
            return false
        }
    }
}

export default new OfflineStorageService()
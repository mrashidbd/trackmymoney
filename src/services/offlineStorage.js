import Dexie from 'dexie'

class OfflineStorageService {
    constructor() {
        this.db = new Dexie('TrackMyMoneyDB')
        this.initDatabase()
    }

    initDatabase() {
        this.db.version(1).stores({
            users: 'id, username, name, token, lastSync',
            categories: 'id, name, type, isDefault, year, userId, localId, needsSync, deleted, createdAt, updatedAt, serverUpdatedAt',
            transactions: 'id, amount, date, type, categoryId, description, year, userId, localId, needsSync, deleted, createdAt, updatedAt, serverUpdatedAt',
            syncQueue: '++id, type, action, data, timestamp, retryCount'
        })

        this.db.version(2).stores({
            categories: 'id, name, type, isDefault, year, userId, localId, needsSync, deleted, createdAt, updatedAt, serverUpdatedAt, [userId+year+deleted], [userId+year+needsSync]',
            transactions: 'id, amount, date, type, categoryId, description, year, userId, localId, needsSync, deleted, createdAt, updatedAt, serverUpdatedAt, [userId+year+deleted], [userId+year+needsSync]'
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
        return await this.db.categories
            .where('userId').equals(userId)
            .and(cat => cat.year === year && cat.deleted === false)
            .toArray()
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
        return await this.db.transactions
            .where('userId').equals(userId)
            .and(trans => trans.year === year && trans.deleted === false)
            .toArray()
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
    async getUnsyncedCategories(userId, year) {
        return await this.db.categories
            .where('userId').equals(userId)
            .and(cat => cat.year === year && cat.needsSync === true)
            .toArray()
    }

    async getUnsyncedTransactions(userId, year) {
        return await this.db.transactions
            .where('userId').equals(userId)
            .and(trans => trans.year === year && trans.needsSync === true)
            .toArray()
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

    // Get database statistics
    async getStats() {
        const categoriesCount = await this.db.categories.count()
        const transactionsCount = await this.db.transactions.count()
        const unsyncedItems = await this.db.categories.where('needsSync').equals(true).count() +
            await this.db.transactions.where('needsSync').equals(true).count()

        return {
            categoriesCount,
            transactionsCount,
            unsyncedItems
        }
    }
}

export default new OfflineStorageService()
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiService from '@/services/api'
import offlineStorage from '@/services/offlineStorage'
import syncService from '@/services/syncService'

export const useCategoriesStore = defineStore('categories', () => {
    const categories = ref([])
    const isLoading = ref(false)
    const currentYear = ref(new Date().getFullYear())
    const isOnline = ref(navigator.onLine)

    // Computed properties
    const incomeCategories = computed(() =>
        categories.value.filter(cat => cat.type === 'income')
    )

    const expenseCategories = computed(() =>
        categories.value.filter(cat => cat.type === 'expense')
    )

    // Set current year
    function setCurrentYear(year) {
        currentYear.value = year
    }

    // Get current user
    function getCurrentUser() {
        const userData = localStorage.getItem('trackmymoney_user')
        return userData ? JSON.parse(userData) : null
    }

    // Initialize categories - hybrid approach
    async function initCategories(year = null) {
        isLoading.value = true
        const user = getCurrentUser()
        const targetYear = year || currentYear.value

        try {
            if (!user?.user?.id) {
                console.error('No user found')
                return
            }

            // Always load from offline storage first (instant)
            const offlineCategories = await offlineStorage.getCategories(user.user.id, targetYear)
            categories.value = offlineCategories

            // If online, try to sync with server
            if (isOnline.value) {
                try {
                    await syncService.fullSync(user.user.id, targetYear)
                    // Reload from offline storage after sync
                    const syncedCategories = await offlineStorage.getCategories(user.user.id, targetYear)
                    categories.value = syncedCategories
                } catch (error) {
                    console.error('Sync failed, using offline data:', error)
                }
            }
        } catch (error) {
            console.error('Error initializing categories:', error)
        } finally {
            isLoading.value = false
        }
    }

    // Add new category - hybrid approach
    async function addCategory(categoryData) {
        const user = getCurrentUser()
        if (!user?.user?.id) {
            throw new Error('No user found')
        }

        try {
            // Save offline first
            const savedCategory = await offlineStorage.saveCategory(
                {
                    ...categoryData,
                    needsSync: true
                },
                user.user.id,
                currentYear.value
            )

            // Add to local state immediately
            categories.value.push(savedCategory)

            // If online, try to sync immediately
            if (isOnline.value) {
                try {
                    const response = await apiService.createCategory(categoryData, currentYear.value)
                    if (response.success) {
                        // Update local storage with server data
                        const updatedCategory = {
                            ...savedCategory,
                            id: response.data.id,
                            localId: null,
                            needsSync: false,
                            serverUpdatedAt: response.data.updatedAt
                        }

                        await offlineStorage.db.categories.put(updatedCategory)

                        // Delete old local record if ID changed
                        if (savedCategory.localId !== response.data.id) {
                            await offlineStorage.db.categories.delete(savedCategory.localId)
                        }

                        // Update local state
                        const index = categories.value.findIndex(cat =>
                            cat.id === savedCategory.id
                        )
                        if (index !== -1) {
                            categories.value[index] = updatedCategory
                        }
                    }
                } catch (error) {
                    console.error('Failed to sync category creation:', error)
                    // Category is saved offline, will sync later
                }
            }

            return savedCategory
        } catch (error) {
            console.error('Error creating category:', error)
            throw error
        }
    }

    // Update category - hybrid approach
    async function updateCategory(id, updateData) {
        const user = getCurrentUser()
        if (!user?.user?.id) {
            throw new Error('No user found')
        }

        try {
            // Update offline first
            const updatedCategory = await offlineStorage.updateCategory(
                id,
                updateData,
                user.user.id,
                currentYear.value
            )

            if (updatedCategory) {
                // Update local state
                const index = categories.value.findIndex(cat =>
                    cat.id === id || cat.localId === id
                )
                if (index !== -1) {
                    categories.value[index] = updatedCategory
                }

                // If online, try to sync immediately
                if (isOnline.value && updatedCategory.id) {
                    try {
                        const response = await apiService.updateCategory(
                            updatedCategory.id,
                            updateData,
                            currentYear.value
                        )
                        if (response.success) {
                            // Update offline storage
                            await offlineStorage.db.categories.put({
                                ...updatedCategory,
                                ...response.data,
                                needsSync: false,
                                serverUpdatedAt: response.data.updatedAt
                            })

                            // Update local state
                            categories.value[index] = { ...response.data, needsSync: false }
                        }
                    } catch (error) {
                        console.error('Failed to sync category update:', error)
                        // Update is saved offline, will sync later
                    }
                }

                return updatedCategory
            }
            return null
        } catch (error) {
            console.error('Error updating category:', error)
            throw error
        }
    }

    // Delete category - hybrid approach
    async function deleteCategory(id) {
        const user = getCurrentUser()
        if (!user?.user?.id) {
            throw new Error('No user found')
        }

        try {
            // First find the category to check if it exists
            const category = categories.value.find(cat =>
                (cat.id === id || cat.localId === id)
            )

            if (!category) {
                return { success: false, message: 'Category not found' }
            }

            // Delete offline first using the correct identifier
            const deleteId = category.id || category.localId
            const success = await offlineStorage.deleteCategory(deleteId, user.user.id, currentYear.value)

            if (success) {
                // Remove from local state
                const index = categories.value.findIndex(cat =>
                    (cat.id === id || cat.localId === id)
                )
                if (index !== -1) {
                    categories.value.splice(index, 1)
                }

                // If online and has server ID, try to sync immediately
                if (isOnline.value && category.id && !category.localId) {
                    try {
                        await apiService.deleteCategory(category.id, currentYear.value)
                    } catch (error) {
                        console.error('Failed to sync category deletion:', error)
                        // Deletion is saved offline, will sync later
                    }
                }

                return { success: true, message: 'Category deleted successfully' }
            }
            return { success: false, message: 'Category not found' }
        } catch (error) {
            console.error('Error deleting category:', error)
            return { success: false, message: error.message || 'Failed to delete category' }
        }
    }

    // Get category by ID
    function getCategoryById(id) {
        return categories.value.find(cat => cat.id === id || cat.localId === id)
    }

    // Get categories by type
    function getCategoriesByType(type) {
        return categories.value.filter(cat => cat.type === type)
    }

    // Force sync
    async function forceSync() {
        const user = getCurrentUser()
        if (!user?.user?.id || !isOnline.value) {
            return { success: false, message: 'Cannot sync while offline' }
        }

        try {
            await syncService.fullSync(user.user.id, currentYear.value)
            // Reload categories after sync
            await initCategories()
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
        categories,
        incomeCategories,
        expenseCategories,
        isLoading,
        currentYear,
        isOnline,
        setCurrentYear,
        initCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        getCategoriesByType,
        forceSync
    }
})
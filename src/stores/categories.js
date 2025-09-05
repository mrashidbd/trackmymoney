import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCategoriesStore = defineStore('categories', () => {
    const categories = ref([])

    // Default categories as per requirements
    const defaultCategories = [
        // Income Categories
        { id: 1, name: 'Monthly Fund', type: 'income', isDefault: true },
        { id: 2, name: 'Special Fund', type: 'income', isDefault: true },
        { id: 3, name: 'Donation', type: 'income', isDefault: true },
        { id: 4, name: 'Personal Money', type: 'income', isDefault: true },
        { id: 5, name: 'Bank Loan', type: 'income', isDefault: true },
        { id: 6, name: 'Borrowed Money', type: 'income', isDefault: true },
        { id: 7, name: 'Others', type: 'income', isDefault: true },

        // Expense Categories
        { id: 8, name: 'Employee Salary', type: 'expense', isDefault: true },
        { id: 9, name: 'Foods & Treats', type: 'expense', isDefault: true },
        { id: 10, name: 'Conveyances', type: 'expense', isDefault: true },
        { id: 11, name: 'Purchase', type: 'expense', isDefault: true },
        { id: 12, name: 'Rents', type: 'expense', isDefault: true },
        { id: 13, name: 'Utility Bills', type: 'expense', isDefault: true },
        { id: 14, name: 'Others', type: 'expense', isDefault: true }
    ]

    // Computed properties
    const incomeCategories = computed(() =>
        categories.value.filter(cat => cat.type === 'income')
    )

    const expenseCategories = computed(() =>
        categories.value.filter(cat => cat.type === 'expense')
    )

    // Initialize categories from localStorage or use defaults
    function initCategories() {
        const savedCategories = localStorage.getItem('trackmymoney_categories')
        if (savedCategories) {
            categories.value = JSON.parse(savedCategories)
        } else {
            categories.value = [...defaultCategories]
            saveCategories()
        }
    }

    // Save categories to localStorage
    function saveCategories() {
        localStorage.setItem('trackmymoney_categories', JSON.stringify(categories.value))
    }

    // Add new category
    function addCategory(categoryData) {
        const newCategory = {
            id: Date.now(), // Simple ID generation
            name: categoryData.name,
            type: categoryData.type,
            isDefault: false,
            createdAt: new Date().toISOString()
        }

        categories.value.push(newCategory)
        saveCategories()
        return newCategory
    }

    // Update category
    function updateCategory(id, updateData) {
        const index = categories.value.findIndex(cat => cat.id === id)
        if (index !== -1) {
            categories.value[index] = {
                ...categories.value[index],
                ...updateData,
                updatedAt: new Date().toISOString()
            }
            saveCategories()
            return categories.value[index]
        }
        return null
    }

    // Delete category
    function deleteCategory(id) {
        const category = categories.value.find(cat => cat.id === id)

        // Prevent deletion of default categories
        if (category && category.isDefault) {
            return { success: false, message: 'Cannot delete default categories' }
        }

        const index = categories.value.findIndex(cat => cat.id === id)
        if (index !== -1) {
            categories.value.splice(index, 1)
            saveCategories()
            return { success: true, message: 'Category deleted successfully' }
        }

        return { success: false, message: 'Category not found' }
    }

    // Get category by ID
    function getCategoryById(id) {
        return categories.value.find(cat => cat.id === id)
    }

    // Get categories by type
    function getCategoriesByType(type) {
        return categories.value.filter(cat => cat.type === type)
    }

    return {
        categories,
        incomeCategories,
        expenseCategories,
        initCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        getCategoriesByType
    }
})
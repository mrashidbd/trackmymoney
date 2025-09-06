<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your transaction categories</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button
            @click="openCategoryModal()"
            class="btn-primary inline-flex items-center space-x-2"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Category</span>
        </button>
      </div>
    </div>

    <!-- Categories Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Income Categories -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            Income Categories
          </h3>
          <span class="text-sm text-gray-500">{{ incomeCategories.length }} categories</span>
        </div>
        <div class="space-y-3">
          <div v-if="incomeCategories.length === 0" class="text-center py-8 text-gray-500">
            <p>No income categories found</p>
            <button
                @click="openCategoryModal('income')"
                class="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Add your first income category
            </button>
          </div>
          <div v-else v-for="category in incomeCategories" :key="category.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
              <div>
                <span class="font-medium text-gray-900">{{ category.name }}</span>
                <div class="flex items-center space-x-2 mt-1">
                  <span v-if="category.isDefault" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Default
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ getCategoryUsage(category.id) }} transactions
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                  @click="editCategory(category)"
                  class="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                  :title="category.isDefault ? 'Edit name only' : 'Edit category'"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                  @click="deleteCategory(category)"
                  :disabled="category.isDefault"
                  :class="[
                  'p-1 rounded transition-colors',
                  category.isDefault
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:text-red-700'
                ]"
                  :title="category.isDefault ? 'Cannot delete default category' : 'Delete category'"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Categories -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <div class="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            Expense Categories
          </h3>
          <span class="text-sm text-gray-500">{{ expenseCategories.length }} categories</span>
        </div>
        <div class="space-y-3">
          <div v-if="expenseCategories.length === 0" class="text-center py-8 text-gray-500">
            <p>No expense categories found</p>
            <button
                @click="openCategoryModal('expense')"
                class="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Add your first expense category
            </button>
          </div>
          <div v-else v-for="category in expenseCategories" :key="category.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
              <div>
                <span class="font-medium text-gray-900">{{ category.name }}</span>
                <div class="flex items-center space-x-2 mt-1">
                  <span v-if="category.isDefault" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Default
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ getCategoryUsage(category.id) }} transactions
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                  @click="editCategory(category)"
                  class="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                  :title="category.isDefault ? 'Edit name only' : 'Edit category'"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                  @click="deleteCategory(category)"
                  :disabled="category.isDefault"
                  :class="[
                  'p-1 rounded transition-colors',
                  category.isDefault
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:text-red-700'
                ]"
                  :title="category.isDefault ? 'Cannot delete default category' : 'Delete category'"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Section -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Add Categories</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
            @click="openCategoryModal('income')"
            class="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group"
        >
          <div class="text-center">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-green-200">
              <svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span class="text-sm font-medium text-green-700">Add Income Category</span>
          </div>
        </button>
        <button
            @click="openCategoryModal('expense')"
            class="flex items-center justify-center p-4 border-2 border-dashed border-red-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors group"
        >
          <div class="text-center">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-red-200">
              <svg class="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span class="text-sm font-medium text-red-700">Add Expense Category</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Category Modal - FIXED -->
    <div
        v-if="showCategoryModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        @click="handleBackdropClick"
    >
      <div
          class="relative top-20 mx-auto p-5 border w-full max-w-md bg-white rounded-lg shadow-lg"
          @click.stop
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingCategory ? 'Edit Category' : 'Add New Category' }}
          </h3>
          <button
              @click="closeCategoryModal"
              class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Category Name -->
            <div>
              <label for="categoryName" class="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span class="text-red-500">*</span>
              </label>
              <input
                  id="categoryName"
                  v-model="categoryForm.name"
                  type="text"
                  required
                  class="input-field"
                  placeholder="Enter category name"
                  :class="{ 'border-red-500': errors.name }"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
            </div>

            <!-- Category Type -->
            <div v-if="!editingCategory">
              <label for="categoryType" class="block text-sm font-medium text-gray-700 mb-1">
                Category Type <span class="text-red-500">*</span>
              </label>
              <select
                  id="categoryType"
                  v-model="categoryForm.type"
                  required
                  class="input-field"
                  :class="{ 'border-red-500': errors.type }"
              >
                <option value="">Select Type</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <p v-if="errors.type" class="mt-1 text-sm text-red-600">{{ errors.type }}</p>
            </div>

            <!-- Current Type Display for Edit -->
            <div v-if="editingCategory" class="p-3 bg-gray-50 rounded-lg">
              <span class="text-sm text-gray-600">Type: </span>
              <span :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                editingCategory.type === 'income'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              ]">
                {{ editingCategory.type.charAt(0).toUpperCase() + editingCategory.type.slice(1) }}
              </span>
            </div>

            <!-- Error message -->
            <div v-if="generalError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {{ generalError }}
            </div>

            <!-- Success message -->
            <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {{ successMessage }}
            </div>

            <!-- Submit Buttons -->
            <div class="flex space-x-3 pt-4">
              <button
                  type="submit"
                  :disabled="isSubmitting"
                  :class="[
                  'btn-primary flex-1',
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                ]"
              >
                <span v-if="isSubmitting" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ editingCategory ? 'Updating...' : 'Adding...' }}
                </span>
                <span v-else>{{ editingCategory ? 'Update Category' : 'Add Category' }}</span>
              </button>

              <button
                  type="button"
                  @click="closeCategoryModal"
                  class="btn-secondary flex-1"
                  :disabled="isSubmitting"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        @click="handleDeleteBackdropClick"
    >
      <div
          class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
          @click.stop
      >
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-5">Delete Category</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete "{{ deletingCategory?.name }}"?
              {{ getCategoryUsage(deletingCategory?.id) > 0
                ? `This category is used in ${getCategoryUsage(deletingCategory?.id)} transaction(s).`
                : ''
              }}
            </p>
            <p v-if="getCategoryUsage(deletingCategory?.id) > 0" class="text-sm text-red-600 mt-2">
              <strong>Warning:</strong> Deleting this category may affect existing transactions.
            </p>
          </div>
          <div class="flex gap-4 mt-4">
            <button
                @click="confirmDelete"
                class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
                @click="showDeleteModal = false"
                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useTransactionsStore } from '@/stores/transactions'

const categoriesStore = useCategoriesStore()
const transactionsStore = useTransactionsStore()

// Reactive data
const showCategoryModal = ref(false)
const editingCategory = ref(null)
const showDeleteModal = ref(false)
const deletingCategory = ref(null)
const isSubmitting = ref(false)
const generalError = ref('')
const successMessage = ref('')

// Form data and validation
const categoryForm = reactive({
  name: '',
  type: ''
})

const errors = reactive({})

// Computed properties
const incomeCategories = computed(() => categoriesStore.incomeCategories)
const expenseCategories = computed(() => categoriesStore.expenseCategories)

// Helper functions
function getCategoryUsage(categoryId) {
  return transactionsStore.transactions.filter(t => t.categoryId === categoryId).length
}

function clearForm() {
  categoryForm.name = ''
  categoryForm.type = ''
  Object.keys(errors).forEach(key => delete errors[key])
  generalError.value = ''
  successMessage.value = ''
}

function validateForm() {
  Object.keys(errors).forEach(key => delete errors[key])
  let isValid = true

  if (!categoryForm.name.trim()) {
    errors.name = 'Category name is required'
    isValid = false
  } else if (categoryForm.name.trim().length < 2) {
    errors.name = 'Category name must be at least 2 characters'
    isValid = false
  } else if (categoryForm.name.trim().length > 50) {
    errors.name = 'Category name cannot exceed 50 characters'
    isValid = false
  }

  if (!editingCategory.value && !categoryForm.type) {
    errors.type = 'Category type is required'
    isValid = false
  }

  // Check for duplicate names within the same type
  const existingCategories = categoryForm.type === 'income'
      ? incomeCategories.value
      : expenseCategories.value

  const duplicateExists = existingCategories.some(cat =>
      cat.name.toLowerCase() === categoryForm.name.trim().toLowerCase() &&
      (!editingCategory.value || cat.id !== editingCategory.value.id)
  )

  if (duplicateExists) {
    errors.name = `A ${categoryForm.type} category with this name already exists`
    isValid = false
  }

  return isValid
}

// Modal functions - FIXED
function openCategoryModal(type = null, category = null) {
  clearForm()
  editingCategory.value = category

  if (category) {
    categoryForm.name = category.name
    categoryForm.type = category.type
  } else if (type) {
    categoryForm.type = type
  }

  showCategoryModal.value = true
}

function closeCategoryModal() {
  showCategoryModal.value = false
  editingCategory.value = null
  clearForm()
}

// Fixed backdrop click handlers
function handleBackdropClick(event) {
  // Only close if clicked on the backdrop itself, not on modal content
  if (event.target === event.currentTarget) {
    closeCategoryModal()
  }
}

function handleDeleteBackdropClick(event) {
  // Only close if clicked on the backdrop itself, not on modal content
  if (event.target === event.currentTarget) {
    showDeleteModal.value = false
  }
}

// CRUD functions
function editCategory(category) {
  openCategoryModal(null, category)
}

function deleteCategory(category) {
  if (category.isDefault) {
    return // Should not reach here due to disabled button
  }
  deletingCategory.value = category
  showDeleteModal.value = true
}

function confirmDelete() {
  if (deletingCategory.value) {
    const result = categoriesStore.deleteCategory(deletingCategory.value.id)
    if (result.success) {
      showDeleteModal.value = false
      deletingCategory.value = null
    } else {
      alert(result.message) // You could replace this with a toast notification
    }
  }
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  generalError.value = ''
  successMessage.value = ''

  try {
    const categoryData = {
      name: categoryForm.name.trim(),
      type: categoryForm.type
    }

    let result
    if (editingCategory.value) {
      result = categoriesStore.updateCategory(editingCategory.value.id, categoryData)
      successMessage.value = 'Category updated successfully!'
    } else {
      result = categoriesStore.addCategory(categoryData)
      successMessage.value = 'Category added successfully!'
    }

    if (result) {
      // Reset form if adding new category
      if (!editingCategory.value) {
        categoryForm.name = ''
        // Keep type selected for easier bulk adding
      }

      // Close modal after a short delay
      setTimeout(() => {
        closeCategoryModal()
      }, 1000)
    } else {
      generalError.value = 'Failed to save category. Please try again.'
    }
  } catch (error) {
    console.error('Error saving category:', error)
    generalError.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Initialize stores
onMounted(async () => {
  await categoriesStore.initCategories()
  await transactionsStore.initTransactions()
})

</script>
<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Amount Field -->
    <div>
      <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
        Amount <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-500 sm:text-sm">$</span>
        </div>
        <input
            id="amount"
            v-model="form.amount"
            type="number"
            step="0.01"
            min="0"
            required
            class="input-field pl-7"
            placeholder="0.00"
            :class="{ 'border-red-500': errors.amount }"
        />
      </div>
      <p v-if="errors.amount" class="mt-1 text-sm text-red-600">{{ errors.amount }}</p>
    </div>

    <!-- Date Field -->
    <div>
      <label for="date" class="block text-sm font-medium text-gray-700 mb-1">
        Date <span class="text-red-500">*</span>
      </label>
      <input
          id="date"
          v-model="form.date"
          type="datetime-local"
          required
          class="input-field"
          :class="{ 'border-red-500': errors.date }"
      />
      <p v-if="errors.date" class="mt-1 text-sm text-red-600">{{ errors.date }}</p>
    </div>

    <!-- Transaction Type -->
    <div>
      <fieldset>
        <legend class="block text-sm font-medium text-gray-700 mb-1">
          Transaction Type <span class="text-red-500">*</span>
        </legend>

        <div class="space-y-2">
          <div class="flex items-center">
            <input
                id="type-income"
                type="radio"
                value="income"
                v-model="form.type"
                @change="handleTypeChange"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                :class="{ 'border-red-500': errors.type }"
            />
            <label for="type-income" class="ml-2 block text-sm text-gray-700">
              Income
            </label>
          </div>

          <div class="flex items-center">
            <input
                id="type-expense"
                type="radio"
                value="expense"
                v-model="form.type"
                @change="handleTypeChange"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                :class="{ 'border-red-500': errors.type }"
            />
            <label for="type-expense" class="ml-2 block text-sm text-gray-700">
              Expense
            </label>
          </div>
        </div>
      </fieldset>

      <p v-if="errors.type" class="mt-1 text-sm text-red-600">{{ errors.type }}</p>
    </div>

    <!-- Category Field -->
    <div>
      <label for="categoryId" class="block text-sm font-medium text-gray-700 mb-1">
        Category <span class="text-red-500">*</span>
      </label>
      <select
          id="categoryId"
          v-model="form.categoryId"
          required
          class="input-field"
          :class="{ 'border-red-500': errors.categoryId }"
          :disabled="!form.type"
      >
        <option value="">{{ form.type ? 'Select Category' : 'Select Type First' }}</option>
        <option
            v-for="category in availableCategories"
            :key="category.id"
            :value="category.id"
        >
          {{ category.name }}
        </option>
      </select>
      <p v-if="errors.categoryId" class="mt-1 text-sm text-red-600">{{ errors.categoryId }}</p>
    </div>

    <!-- Description Field -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="input-field resize-none"
          placeholder="Enter transaction details..."
          :class="{ 'border-red-500': errors.description }"
      ></textarea>
      <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
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
          {{ isEdit ? 'Updating...' : 'Adding...' }}
        </span>
        <span v-else>{{ isEdit ? 'Update Transaction' : 'Add Transaction' }}</span>
      </button>

      <button
          type="button"
          @click="$emit('cancel')"
          class="btn-secondary flex-1"
          :disabled="isSubmitting"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { format } from 'date-fns'
import { useCategoriesStore } from '@/stores/categories'
import { useTransactionsStore } from '@/stores/transactions'

const props = defineProps({
  transaction: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['success', 'cancel'])

const categoriesStore = useCategoriesStore()
const transactionsStore = useTransactionsStore()

const isSubmitting = ref(false)
const generalError = ref('')
const successMessage = ref('')
const errors = reactive({})

const isEdit = computed(() => !!props.transaction)

// Form data
const form = reactive({
  amount: '',
  date: '',
  type: '',
  categoryId: '',
  description: ''
})

// Available categories based on selected type
const availableCategories = computed(() => {
  if (!form.type) return []
  return form.type === 'income'
      ? categoriesStore.incomeCategories
      : categoriesStore.expenseCategories
})

// Initialize form
onMounted(() => {
  // Set default date to current date/time
  const now = new Date()
  form.date = format(now, "yyyy-MM-dd'T'HH:mm")

  // If editing, populate form with transaction data
  if (props.transaction) {
    form.amount = props.transaction.amount.toString()
    form.date = props.transaction.date
    form.type = props.transaction.type
    form.categoryId = props.transaction.categoryId.toString()
    form.description = props.transaction.description || ''
  }
})

// Handle type change - reset category when type changes
function handleTypeChange() {
  form.categoryId = ''
  clearErrors()
}

// Clear all errors
function clearErrors() {
  Object.keys(errors).forEach(key => {
    delete errors[key]
  })
  generalError.value = ''
  successMessage.value = ''
}

// Validate form
function validateForm() {
  clearErrors()
  let isValid = true

  if (!form.amount || parseFloat(form.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0'
    isValid = false
  }

  if (!form.date) {
    errors.date = 'Date is required'
    isValid = false
  }

  if (!form.type) {
    errors.type = 'Transaction type is required'
    isValid = false
  }

  if (!form.categoryId) {
    errors.categoryId = 'Category is required'
    isValid = false
  }

  if (form.description && form.description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters'
    isValid = false
  }

  return isValid
}

// Handle form submission
async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  generalError.value = ''
  successMessage.value = ''

  try {
    const transactionData = {
      amount: form.amount,
      date: form.date,
      type: form.type,
      categoryId: form.categoryId,
      description: form.description.trim()
    }

    let result
    if (isEdit.value) {
      result = transactionsStore.updateTransaction(props.transaction.id, transactionData)
      successMessage.value = 'Transaction updated successfully!'
    } else {
      result = transactionsStore.addTransaction(transactionData)
      successMessage.value = 'Transaction added successfully!'
    }

    if (result) {
      // Reset form if adding new transaction
      if (!isEdit.value) {
        Object.keys(form).forEach(key => {
          if (key === 'date') {
            const now = new Date()
            form[key] = format(now, "yyyy-MM-dd'T'HH:mm")
          } else {
            form[key] = ''
          }
        })
      }

      // Emit success event
      setTimeout(() => {
        emit('success', result)
      }, 1000)
    } else {
      generalError.value = 'Failed to save transaction. Please try again.'
    }
  } catch (error) {
    console.error('Error saving transaction:', error)
    generalError.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Watch for changes in transaction prop (for editing)
watch(() => props.transaction, (newTransaction) => {
  if (newTransaction) {
    form.amount = newTransaction.amount.toString()
    form.date = newTransaction.date
    form.type = newTransaction.type
    form.categoryId = newTransaction.categoryId.toString()
    form.description = newTransaction.description || ''
  }
}, { immediate: true })
</script>
<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Change Password</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ isFirstLogin ? 'Please change your temporary password' : 'Update your account password' }}
        </p>
      </div>
    </div>

    <!-- Alert for first login -->
    <div v-if="isFirstLogin" class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
      <div class="flex">
        <svg class="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="text-sm">
          For security reasons, you must change your temporary password before continuing.
        </span>
      </div>
    </div>

    <!-- Change Password Form -->
    <div class="card max-w-2xl">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Current Password -->
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Current Password <span class="text-red-500">*</span>
          </label>
          <input
              id="currentPassword"
              v-model="form.currentPassword"
              type="password"
              required
              class="input-field"
              placeholder="Enter your current password"
              :disabled="isSubmitting"
          />
        </div>

        <!-- New Password -->
        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
            New Password <span class="text-red-500">*</span>
          </label>
          <input
              id="newPassword"
              v-model="form.newPassword"
              type="password"
              required
              minlength="6"
              class="input-field"
              placeholder="Enter new password (min 6 characters)"
              :disabled="isSubmitting"
          />
          <p class="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
        </div>

        <!-- Confirm New Password -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password <span class="text-red-500">*</span>
          </label>
          <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              minlength="6"
              class="input-field"
              placeholder="Confirm your new password"
              :disabled="isSubmitting"
          />
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ errorMessage }}
        </div>

        <!-- Success message -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {{ successMessage }}
        </div>

        <!-- Submit Buttons -->
        <div class="flex space-x-3">
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
              Updating...
            </span>
            <span v-else>Change Password</span>
          </button>

          <button
              v-if="!isFirstLogin"
              type="button"
              @click="$router.back()"
              class="btn-secondary flex-1"
              :disabled="isSubmitting"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import apiService from '@/services/api'

const router = useRouter()
const route = useRoute()

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const isFirstLogin = computed(() => route.query.first === 'true')

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Validate passwords match
  if (form.newPassword !== form.confirmPassword) {
    errorMessage.value = 'New passwords do not match'
    return
  }

  // Validate password length
  if (form.newPassword.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long'
    return
  }

  // Validate new password is different from current
  if (form.currentPassword === form.newPassword) {
    errorMessage.value = 'New password must be different from current password'
    return
  }

  isSubmitting.value = true

  try {
    const response = await apiService.changePassword(form.currentPassword, form.newPassword)

    if (response.success) {
      successMessage.value = 'Password changed successfully!'

      // Reset form
      form.currentPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''

      // Redirect after a short delay
      setTimeout(() => {
        if (isFirstLogin.value) {
          router.push('/')
        } else {
          router.back()
        }
      }, 1500)
    } else {
      errorMessage.value = response.message || 'Failed to change password'
    }
  } catch (error) {
    console.error('Error changing password:', error)
    errorMessage.value = 'An error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
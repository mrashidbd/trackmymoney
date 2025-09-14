<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
          <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Reset Your Password
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ userEmail ? `Enter a new password for ${userEmail}` : 'Enter your new password below' }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isVerifying" class="text-center py-8">
        <svg class="animate-spin h-8 w-8 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-gray-600">Verifying reset token...</p>
      </div>

      <!-- Invalid Token -->
      <div v-else-if="tokenInvalid" class="text-center py-8">
        <div class="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Invalid or Expired Link</h3>
        <p class="text-sm text-gray-600 mb-6">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <router-link
            to="/login"
            class="btn-primary inline-flex items-center space-x-2"
        >
          <span>Back to Login</span>
        </router-link>
      </div>

      <!-- Reset Form -->
      <form v-else @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <!-- Error message -->
        <div
            v-if="errorMessage"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {{ errorMessage }}
        </div>

        <!-- Success message -->
        <div
            v-if="successMessage"
            class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
        >
          {{ successMessage }}
        </div>

        <div class="space-y-4">
          <!-- New Password field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
                id="password"
                v-model="form.password"
                type="password"
                required
                minlength="6"
                class="input-field"
                placeholder="Enter new password (min 6 characters)"
                :disabled="isSubmitting"
            />
          </div>

          <!-- Confirm Password field -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                required
                minlength="6"
                class="input-field"
                placeholder="Confirm new password"
                :disabled="isSubmitting"
            />
          </div>
        </div>

        <!-- Submit button -->
        <div>
          <button
              type="submit"
              :disabled="isSubmitting"
              :class="[
              'btn-primary',
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            ]"
          >
            <span v-if="isSubmitting" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resetting...
            </span>
            <span v-else>Reset Password</span>
          </button>
        </div>

        <div class="text-center">
          <router-link
              to="/login"
              class="text-sm text-primary-600 hover:text-primary-500"
          >
            Back to Login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import apiService from '@/services/api'

const router = useRouter()
const route = useRoute()

const form = reactive({
  password: '',
  confirmPassword: ''
})

const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const isVerifying = ref(true)
const tokenInvalid = ref(false)
const userEmail = ref('')
const resetToken = ref('')

const verifyToken = async () => {
  const token = route.query.token

  if (!token) {
    tokenInvalid.value = true
    isVerifying.value = false
    return
  }

  resetToken.value = token

  try {
    const response = await apiService.verifyResetToken(token)

    if (response.success) {
      userEmail.value = response.email
      isVerifying.value = false
    } else {
      tokenInvalid.value = true
      isVerifying.value = false
    }
  } catch (error) {
    tokenInvalid.value = true
    isVerifying.value = false
  }
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Validate passwords match
  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  // Validate password length
  if (form.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long'
    return
  }

  isSubmitting.value = true

  try {
    const response = await apiService.resetPassword(resetToken.value, form.password)

    if (response.success) {
      successMessage.value = 'Password reset successfully! Redirecting to login...'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      errorMessage.value = response.message || 'Failed to reset password'
    }
  } catch (error) {
    errorMessage.value = 'An error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  verifyToken()
})
</script>
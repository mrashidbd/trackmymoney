<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
          <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Track My Money
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Sign in to your personal finance tracker
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
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
          <!-- Email field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="input-field"
                placeholder="Enter your email"
                :disabled="authStore.isLoading"
            />
          </div>

          <!-- Password field -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                  type="button"
                  @click="showForgotPassword = true"
                  class="text-sm text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </button>
            </div>
            <input
                id="password"
                v-model="form.password"
                type="password"
                required
                class="input-field"
                placeholder="Enter your password"
                :disabled="authStore.isLoading"
            />
          </div>
        </div>

        <!-- Submit button -->
        <div>
          <button
              type="submit"
              :disabled="authStore.isLoading"
              :class="[
              'btn-primary',
              authStore.isLoading ? 'opacity-50 cursor-not-allowed' : ''
            ]"
          >
            <span v-if="authStore.isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
            <span v-else>Sign in</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Forgot Password Modal -->
    <div
        v-if="showForgotPassword"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        @click="handleModalBackdropClick"
    >
      <div class="relative top-20 mx-auto p-5 border w-full max-w-md bg-white rounded-lg shadow-lg">
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Reset Password</h3>
          <button
              @click="closeForgotPasswordModal"
              class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6">
          <form @submit.prevent="handleForgotPassword" class="space-y-4">
            <p class="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div>
              <label for="reset-email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                  id="reset-email"
                  v-model="forgotPasswordEmail"
                  type="email"
                  required
                  class="input-field"
                  placeholder="Enter your email"
                  :disabled="isResetting"
              />
            </div>

            <div v-if="resetError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {{ resetError }}
            </div>

            <div v-if="resetSuccess" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {{ resetSuccess }}
            </div>

            <div class="flex space-x-3">
              <button
                  type="submit"
                  :disabled="isResetting"
                  :class="[
                    'btn-primary flex-1',
                    isResetting ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
              >
                {{ isResetting ? 'Sending...' : 'Send Reset Link' }}
              </button>
              <button
                  type="button"
                  @click="closeForgotPasswordModal"
                  class="btn-secondary flex-1"
                  :disabled="isResetting"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiService from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: ''
})

const errorMessage = ref('')
const successMessage = ref('')
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')
const isResetting = ref(false)
const resetError = ref('')
const resetSuccess = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const result = await authStore.login(form.email, form.password)

  if (result.success) {
    // Check if this is first login (temporary password)
    if (result.firstLogin) {
      router.push('/change-password?first=true')
    } else {
      router.push('/')
    }
  } else {
    errorMessage.value = result.message
  }
}

const handleForgotPassword = async () => {
  resetError.value = ''
  resetSuccess.value = ''
  isResetting.value = true

  try {
    const response = await apiService.forgotPassword(forgotPasswordEmail.value)

    if (response.success) {
      resetSuccess.value = 'If the email exists in our system, you will receive a password reset link.'
      setTimeout(() => {
        closeForgotPasswordModal()
      }, 3000)
    } else {
      resetError.value = response.message || 'Failed to send reset link'
    }
  } catch (error) {
    resetError.value = 'An error occurred. Please try again.'
  } finally {
    isResetting.value = false
  }
}

const closeForgotPasswordModal = () => {
  showForgotPassword.value = false
  forgotPasswordEmail.value = ''
  resetError.value = ''
  resetSuccess.value = ''
}

const handleModalBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    closeForgotPasswordModal()
  }
}
</script>
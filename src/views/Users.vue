<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
        <p class="mt-1 text-sm text-gray-500">Manage system users and their access</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button
            @click="openUserModal()"
            class="btn-primary inline-flex items-center space-x-2"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Add User</span>
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="card">
      <div class="overflow-hidden">
        <div v-if="isLoading" class="text-center py-12">
          <svg class="animate-spin h-8 w-8 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <div v-else-if="users.length === 0" class="text-center py-12">
          <p class="text-gray-500">No users found</p>
        </div>

        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-medium">
                      {{ user.name?.charAt(0) || 'U' }}
                    </span>
                </div>
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                  <div class="text-xs text-gray-500">ID: {{ user.id }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ user.username }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  user.role === 'superadmin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                ]">
                  {{ user.role === 'superadmin' ? 'Super Admin' : 'User' }}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                ]">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ user.last_login ? formatDate(user.last_login) : 'Never' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <router-link
                    :to="`/transactions?userId=${user.id}`"
                    class="text-green-600 hover:text-green-700"
                    title="View Transactions"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </router-link>
                <button
                    @click="editUser(user)"
                    class="text-blue-600 hover:text-blue-700"
                    :disabled="user.username === 'mRashid'"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                    @click="toggleUserStatus(user)"
                    :disabled="user.role === 'superadmin'"
                    :class="[
                        'transition-colors',
                        user.role === 'superadmin'
                          ? 'text-gray-400 cursor-not-allowed'
                          : user.is_active
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-green-600 hover:text-green-700'
                      ]"
                    :title="user.is_active ? 'Deactivate user' : 'Activate user'"
                >
                  <svg v-if="user.is_active" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Modal -->
    <div
        v-if="showUserModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        @click="handleBackdropClick"
    >
      <div class="relative top-20 mx-auto p-5 border w-full max-w-md bg-white rounded-lg shadow-lg">
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingUser ? 'Edit User' : 'Add New User' }}
          </h3>
          <button @click="closeUserModal" class="text-gray-400 hover:text-gray-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                  id="name"
                  v-model="userForm.name"
                  type="text"
                  required
                  class="input-field"
                  :class="{ 'border-red-500': errors.name }"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
            </div>

            <div v-if="!editingUser">
              <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
                Username <span class="text-red-500">*</span>
              </label>
              <input
                  id="username"
                  v-model="userForm.username"
                  type="text"
                  required
                  class="input-field"
                  :class="{ 'border-red-500': errors.username }"
              />
              <p v-if="errors.username" class="mt-1 text-sm text-red-600">{{ errors.username }}</p>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                Password {{ !editingUser ? '*' : '(leave blank to keep current)' }}
              </label>
              <input
                  id="password"
                  v-model="userForm.password"
                  type="password"
                  :required="!editingUser"
                  class="input-field"
                  :class="{ 'border-red-500': errors.password }"
              />
              <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
            </div>

            <div>
              <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
                Role <span class="text-red-500">*</span>
              </label>
              <select
                  id="role"
                  v-model="userForm.role"
                  required
                  class="input-field"
                  :disabled="editingUser?.username === 'mRashid'"
              >
                <option value="user">User</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div v-if="generalError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {{ generalError }}
            </div>

            <div class="flex space-x-3 pt-4">
              <button
                  type="submit"
                  :disabled="isSubmitting"
                  :class="[
                    'btn-primary flex-1',
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
              >
                {{ isSubmitting ? 'Saving...' : (editingUser ? 'Update User' : 'Add User') }}
              </button>
              <button type="button" @click="closeUserModal" class="btn-secondary flex-1">
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
import { ref, reactive, onMounted } from 'vue'
import { format } from 'date-fns'
import apiService from '@/services/api'

// Reactive data
const users = ref([])
const isLoading = ref(false)
const showUserModal = ref(false)
const editingUser = ref(null)
const isSubmitting = ref(false)
const generalError = ref('')

const userForm = reactive({
  name: '',
  username: '',
  password: '',
  role: 'user'
})

const errors = reactive({})

// Helper functions
function formatDate(dateString) {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
}

function clearForm() {
  userForm.name = ''
  userForm.username = ''
  userForm.password = ''
  userForm.role = 'user'
  Object.keys(errors).forEach(key => delete errors[key])
  generalError.value = ''
}

function validateForm() {
  Object.keys(errors).forEach(key => delete errors[key])
  let isValid = true

  if (!userForm.name.trim()) {
    errors.name = 'Name is required'
    isValid = false
  }

  if (!editingUser.value && !userForm.username.trim()) {
    errors.username = 'Username is required'
    isValid = false
  }

  if (!editingUser.value && !userForm.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (userForm.password && userForm.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }

  return isValid
}

// Fetch users
async function fetchUsers() {
  isLoading.value = true
  try {
    const response = await apiService.request('/users')
    if (response.success) {
      users.value = response.data
    }
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    isLoading.value = false
  }
}

// Modal functions
function openUserModal(user = null) {
  clearForm()
  editingUser.value = user

  if (user) {
    userForm.name = user.name
    userForm.username = user.username
    userForm.role = user.role || 'user'
  }

  showUserModal.value = true
}

function closeUserModal() {
  showUserModal.value = false
  editingUser.value = null
  clearForm()
}

function handleBackdropClick(event) {
  if (event.target === event.currentTarget) {
    closeUserModal()
  }
}

// CRUD functions
function editUser(user) {
  if (user.username !== 'mRashid') {
    openUserModal(user)
  }
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  generalError.value = ''

  try {
    let response
    if (editingUser.value) {
      // Update user
      const updates = {
        name: userForm.name,
        role: userForm.role
      }
      if (userForm.password) {
        updates.password = userForm.password
      }

      response = await apiService.request(`/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } else {
      // Create user
      response = await apiService.request('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: userForm.name,
          username: userForm.username,
          password: userForm.password,
          role: userForm.role
        })
      })
    }

    if (response.success) {
      await fetchUsers()
      closeUserModal()
    } else {
      generalError.value = response.message || 'Failed to save user'
    }
  } catch (error) {
    console.error('Error saving user:', error)
    generalError.value = error.message || 'An error occurred while saving user'
  } finally {
    isSubmitting.value = false
  }
}

async function toggleUserStatus(user) {
  if (user.role === 'superadmin') return

  try {
    const response = await apiService.request(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: !user.is_active })
    })

    if (response.success) {
      await fetchUsers()
    }
  } catch (error) {
    console.error('Error toggling user status:', error)
  }
}

// Initialize
onMounted(() => {
  fetchUsers()
})
</script>
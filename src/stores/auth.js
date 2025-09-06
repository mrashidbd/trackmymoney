import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiService from '@/services/api'
import offlineStorage from '@/services/offlineStorage'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const isLoading = ref(false)

    const isAuthenticated = computed(() => !!user.value)

    // Initialize auth state from localStorage
    function initAuth() {
        const savedUser = localStorage.getItem('trackmymoney_user')
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser)
                user.value = userData.user
                // Verify token is still valid
                verifyToken()
            } catch (error) {
                console.error('Error parsing saved user data:', error)
                logout()
            }
        }
    }

    // Verify token with backend
    async function verifyToken() {
        try {
            const response = await apiService.verifyToken()
            if (response.success) {
                user.value = response.user
            } else {
                logout()
            }
        } catch (error) {
            console.error('Token verification failed:', error)
            logout()
        }
    }

    // Login function
    async function login(username, password) {
        isLoading.value = true

        try {
            const response = await apiService.login(username, password)

            if (response.success) {
                const userData = {
                    user: response.user,
                    token: response.token,
                    loginTime: new Date().toISOString()
                }

                user.value = response.user
                localStorage.setItem('trackmymoney_user', JSON.stringify(userData))
                await saveUserOffline(userData)
                return { success: true }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, message: error.message || 'Login failed. Please try again.' }
        } finally {
            isLoading.value = false
        }
    }

    // Register function
    async function register(username, password, name) {
        isLoading.value = true

        try {
            const response = await apiService.register(username, password, name)

            if (response.success) {
                const userData = {
                    user: response.user,
                    token: response.token,
                    loginTime: new Date().toISOString()
                }

                user.value = response.user
                localStorage.setItem('trackmymoney_user', JSON.stringify(userData))
                await saveUserOffline(userData)
                return { success: true }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error) {
            console.error('Registration error:', error)
            return { success: false, message: error.message || 'Registration failed. Please try again.' }
        } finally {
            isLoading.value = false
        }
    }

    // Logout function
    function logout() {
        user.value = null
        localStorage.removeItem('trackmymoney_user')
        // Clear offline data on logout
        offlineStorage.clearAllData()
    }

    async function saveUserOffline(userData) {
        await offlineStorage.saveUser(userData)
    }


    return {
        user,
        isLoading,
        isAuthenticated,
        initAuth,
        login,
        register,
        logout,
        verifyToken
    }
})
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const isLoading = ref(false)

    // Default credentials (you can change these)
    const DEFAULT_USERNAME = 'admin'
    const DEFAULT_PASSWORD = 'admin123'

    const isAuthenticated = computed(() => !!user.value)

    // Initialize auth state from localStorage
    function initAuth() {
        const savedUser = localStorage.getItem('trackmymoney_user')
        if (savedUser) {
            user.value = JSON.parse(savedUser)
        }
    }

    // Login function
    async function login(username, password) {
        isLoading.value = true

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Simple credential check (in production, this would be an API call)
            if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
                const userData = {
                    id: 1,
                    username: username,
                    name: 'Admin User',
                    loginTime: new Date().toISOString()
                }

                user.value = userData
                localStorage.setItem('trackmymoney_user', JSON.stringify(userData))
                return { success: true }
            } else {
                return { success: false, message: 'Invalid credentials' }
            }
        } catch (error) {
            return { success: false, message: 'Login failed. Please try again.' }
        } finally {
            isLoading.value = false
        }
    }

    // Logout function
    function logout() {
        user.value = null
        localStorage.removeItem('trackmymoney_user')
    }

    // Change password function
    async function changePassword(currentPassword, newPassword) {
        if (currentPassword !== DEFAULT_PASSWORD) {
            return { success: false, message: 'Current password is incorrect' }
        }

        // In a real app, you'd update this on the server
        // For now, we'll just simulate success
        return { success: true, message: 'Password changed successfully' }
    }

    return {
        user,
        isLoading,
        isAuthenticated,
        initAuth,
        login,
        logout,
        changePassword
    }
})
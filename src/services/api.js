const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL
    }

    // Get auth token from localStorage
    getAuthToken() {
        const user = localStorage.getItem('trackmymoney_user')
        if (user) {
            const userData = JSON.parse(user)
            return userData.token
        }
        return null
    }

    // Create request headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        }

        if (includeAuth) {
            const token = this.getAuthToken()
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }
        }

        return headers
    }

// Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.requiresAuth !== false),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            // Handle network errors
            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    // Response is not JSON, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);

            // Handle specific error types
            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error - please check your connection');
            }

            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify({ email, password })
        })
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        })
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify({ email })
        })
    }

    async verifyResetToken(token) {
        return this.request(`/auth/verify-reset-token?token=${token}`, {
            requiresAuth: false
        })
    }

    async resetPassword(token, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify({ token, newPassword })
        })
    }

    async verifyToken() {
        return this.request('/auth/verify')
    }

    // Categories endpoints
    async getCategories(year) {
        const yearParam = year ? `?year=${year}` : ''
        return this.request(`/categories${yearParam}`)
    }

    async createCategory(categoryData, year) {
        const yearParam = year ? `?year=${year}` : ''
        return this.request(`/categories${yearParam}`, {
            method: 'POST',
            body: JSON.stringify(categoryData)
        })
    }

    async updateCategory(id, categoryData, year) {
        const yearParam = year ? `?year=${year}` : ''
        return this.request(`/categories/${id}${yearParam}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        })
    }

    async deleteCategory(id, year) {
        const yearParam = year ? `?year=${year}` : ''
        return this.request(`/categories/${id}${yearParam}`, {
            method: 'DELETE'
        })
    }

    // Transactions endpoints
    async getTransactions(year, userId = null) {
        let params = new URLSearchParams()
        if (year) params.append('year', year)
        if (userId) params.append('userId', userId)
        const queryString = params.toString()

        return this.request(`/transactions${queryString ? '?' + queryString : ''}`)
    }

    async getTransactionsByRange(startDate, endDate, year) {
        const params = new URLSearchParams({
            startDate,
            endDate
        })
        if (year) params.append('year', year)

        return this.request(`/transactions/range?${params}`)
    }

    async createTransaction(transactionData) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        })
    }

    async updateTransaction(id, transactionData) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData)
        })
    }

    async deleteTransaction(id, year) {
        const yearParam = year ? `?year=${year}` : ''
        return this.request(`/transactions/${id}${yearParam}`, {
            method: 'DELETE'
        })
    }

    async getTransactionStats(year) {
        const yearParam = year ? `?year=${year}` : ''
        return this.request(`/transactions/stats${yearParam}`)
    }

    // Years endpoint
    async getUserYears() {
        return this.request('/years')
    }

    // Backup endpoint
    async createBackup(year) {
        return this.request(`/backup/${year}`, {
            method: 'POST'
        })
    }

    // Health check
    async healthCheck() {
        return this.request('/health', {
            requiresAuth: false
        })
    }
}

export default new ApiService()
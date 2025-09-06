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
        const url = `${this.baseURL}${endpoint}`
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.requiresAuth !== false),
                ...options.headers
            }
        }

        try {
            const response = await fetch(url, config)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`)
            }

            return data
        } catch (error) {
            console.error('API request failed:', error)
            throw error
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify({ username, password })
        })
    }

    async register(username, password, name) {
        return this.request('/auth/register', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify({ username, password, name })
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
    async getTransactions(year) {
        const yearParam = year ? `?year=${year}` : ''
        return this.request(`/transactions${yearParam}`)
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
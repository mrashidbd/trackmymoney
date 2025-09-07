// Global error handler utility
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = isOperational
        this.name = this.constructor.name

        Error.captureStackTrace(this, this.constructor)
    }
}

export const handleApiError = (error) => {
    console.error('API Error:', error)

    // Network errors
    if (!navigator.onLine) {
        return {
            success: false,
            message: 'No internet connection. Changes will be saved locally and synced when online.',
            isOffline: true
        }
    }

    // HTTP errors
    if (error.response) {
        const status = error.response.status
        const message = error.response.data?.message || 'An error occurred'

        switch (status) {
            case 401:
                return {
                    success: false,
                    message: 'Session expired. Please log in again.',
                    requiresLogin: true
                }
            case 403:
                return {
                    success: false,
                    message: 'You do not have permission to perform this action.'
                }
            case 404:
                return {
                    success: false,
                    message: 'Resource not found.'
                }
            case 429:
                return {
                    success: false,
                    message: 'Too many requests. Please try again later.'
                }
            case 500:
                return {
                    success: false,
                    message: 'Server error. Please try again later.'
                }
            default:
                return {
                    success: false,
                    message
                }
        }
    }

    // Default error
    return {
        success: false,
        message: error.message || 'An unexpected error occurred'
    }
}

export const logError = (error, context = '') => {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    }

    console.error('Application Error:', errorInfo)

    // In production, you could send this to an error reporting service
    if (import.meta.env.PROD) {
        // sendToErrorReportingService(errorInfo)
    }
}
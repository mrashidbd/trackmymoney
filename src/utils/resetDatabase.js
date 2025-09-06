import offlineStorage from '@/services/offlineStorage'

// Function to reset database and clear localStorage
export async function resetApplicationData() {
    try {
        // Reset database
        await offlineStorage.resetDatabase()

        // Clear all localStorage data
        localStorage.removeItem('trackmymoney_user')

        // Reload the page to start fresh
        window.location.reload()

        return true
    } catch (error) {
        console.error('Error resetting application data:', error)
        return false
    }
}

// Expose to window for manual reset
window.resetTrackMyMoney = resetApplicationData
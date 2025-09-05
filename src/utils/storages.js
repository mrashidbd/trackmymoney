// Storage keys
export const STORAGE_KEYS = {
    USER: 'trackmymoney_user',
    TRANSACTIONS: 'trackmymoney_transactions',
    CATEGORIES: 'trackmymoney_categories',
    SETTINGS: 'trackmymoney_settings'
}

// Generic storage functions
export function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data))
        return true
    } catch (error) {
        console.error('Error saving to localStorage:', error)
        return false
    }
}

export function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
    } catch (error) {
        console.error('Error loading from localStorage:', error)
        return defaultValue
    }
}

export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key)
        return true
    } catch (error) {
        console.error('Error removing from localStorage:', error)
        return false
    }
}

export function clearAllStorage() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key)
        })
        return true
    } catch (error) {
        console.error('Error clearing localStorage:', error)
        return false
    }
}

// Data export/import functions
export function exportData() {
    const data = {
        transactions: loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []),
        categories: loadFromStorage(STORAGE_KEYS.CATEGORIES, []),
        settings: loadFromStorage(STORAGE_KEYS.SETTINGS, {}),
        exportDate: new Date().toISOString(),
        version: '1.0'
    }
    return data
}

export function importData(data) {
    try {
        if (data.transactions) {
            saveToStorage(STORAGE_KEYS.TRANSACTIONS, data.transactions)
        }
        if (data.categories) {
            saveToStorage(STORAGE_KEYS.CATEGORIES, data.categories)
        }
        if (data.settings) {
            saveToStorage(STORAGE_KEYS.SETTINGS, data.settings)
        }
        return { success: true, message: 'Data imported successfully' }
    } catch (error) {
        console.error('Error importing data:', error)
        return { success: false, message: 'Failed to import data' }
    }
}

// Backup functions
export function createBackup() {
    const backup = exportData()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `trackmymoney-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function restoreBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result)
                const result = importData(data)
                resolve(result)
            } catch (error) {
                reject(new Error('Invalid backup file format'))
            }
        }
        reader.onerror = () => reject(new Error('Failed to read backup file'))
        reader.readAsText(file)
    })
}
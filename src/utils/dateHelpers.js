import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Math.abs(amount))
}

export function formatDate(dateString, formatStr = 'MMM dd, yyyy') {
    return format(new Date(dateString), formatStr)
}

export function formatDateTime(dateString) {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
}

export function getCurrentMonthRange() {
    const now = new Date()
    return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd')
    }
}

export function getLastMonthRange() {
    const lastMonth = subMonths(new Date(), 1)
    return {
        start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
    }
}

export function getCurrentYearRange() {
    const now = new Date()
    return {
        start: format(startOfYear(now), 'yyyy-MM-dd'),
        end: format(endOfYear(now), 'yyyy-MM-dd')
    }
}

export function getDateRangeOptions() {
    return [
        {
            value: 'current-month',
            label: 'Current Month',
            range: getCurrentMonthRange()
        },
        {
            value: 'last-month',
            label: 'Last Month',
            range: getLastMonthRange()
        },
        {
            value: 'current-year',
            label: 'Current Year',
            range: getCurrentYearRange()
        }
    ]
}
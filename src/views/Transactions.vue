<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Transactions</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your income and expenses</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button class="btn-primary inline-flex items-center space-x-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Transaction</span>
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
              type="text"
              placeholder="Search transactions..."
              class="input-field"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select class="input-field">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select class="input-field">
            <option value="">All Categories</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select class="input-field">
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="card">
      <div class="overflow-hidden">
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900">No transactions found</h3>
          <p class="mt-2 text-sm text-gray-500">
            Get started by creating your first transaction.
          </p>
          <div class="mt-6">
            <button class="btn-primary inline-flex items-center space-x-2">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Your First Transaction</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Transactions logic will be implemented in the next step
</script>
'use client'

import React from 'react'

interface MonthSelectorProps {
    currentDate: Date
    onDateChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onDateChange }: MonthSelectorProps) {
    const handlePrevMonth = () => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() - 1)
        onDateChange(newDate)
    }

    const handleNextMonth = () => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + 1)
        onDateChange(newDate)
    }

    return (
        <div className="flex items-center justify-center space-x-4 mb-6 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 w-fit mx-auto">
            <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
                <span className="material-icons">chevron_left</span>
            </button>

            <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white capitalize min-w-[140px] text-center">
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
            </div>

            <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
                <span className="material-icons">chevron_right</span>
            </button>
        </div>
    )
}

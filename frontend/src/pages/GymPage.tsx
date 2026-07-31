import { useState, useEffect } from 'react'
import { Dumbbell, Utensils, Scale } from 'lucide-react'
import { GymSummaryHeader } from '@/components/gym/GymSummaryHeader'
import { WorkoutTab } from '@/components/gym/WorkoutTab'
import { DietTab } from '@/components/gym/DietTab'
import { WeightTab } from '@/components/gym/WeightTab'
import type { GymSummary } from '@/types'
import { getGymSummary } from '@/services/gym'

type TabType = 'workouts' | 'diet' | 'weight'

export function GymPage() {
  const [activeTab, setActiveTab] = useState<TabType>('workouts')
  const [summary, setSummary] = useState<GymSummary | null>(null)

  const fetchSummary = async () => {
    try {
      const data = await getGymSummary()
      setSummary(data)
    } catch (err) {
      console.error('Failed to load gym summary:', err)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header Title */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-md">
              <Dumbbell className="h-6 w-6" />
            </div>
            Gym & Fitness Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track daily workouts, multi-week programs, diet & calories, and body weight progress.
          </p>
        </div>
      </div>

      {/* Summary Cards Header */}
      <GymSummaryHeader summary={summary} />

      {/* Navigation Tabs */}
      <div className="mb-6 flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('workouts')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
            activeTab === 'workouts'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>Workouts & Routine</span>
        </button>

        <button
          onClick={() => setActiveTab('diet')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
            activeTab === 'diet'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <Utensils className="h-4 w-4" />
          <span>Diet & Nutrition</span>
        </button>

        <button
          onClick={() => setActiveTab('weight')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
            activeTab === 'weight'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Weight Progress</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'workouts' && <WorkoutTab onWorkoutChange={fetchSummary} />}
      {activeTab === 'diet' && <DietTab onDietChange={fetchSummary} />}
      {activeTab === 'weight' && <WeightTab onWeightChange={fetchSummary} />}
    </div>
  )
}

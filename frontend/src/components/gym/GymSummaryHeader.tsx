import { Dumbbell, Utensils, Scale, Calendar, CheckCircle2 } from 'lucide-react'
import type { GymSummary } from '@/types'

interface GymSummaryHeaderProps {
  summary: GymSummary | null
}

export function GymSummaryHeader({ summary }: GymSummaryHeaderProps) {
  const currentWeek = summary?.current_week || 1
  const completed = summary?.completed_workouts || 0
  const totalWorkouts = summary?.total_workouts || 0
  const avgCals = summary?.avg_calories_per_day || 0
  const weight = summary?.latest_weight
  const weightChange = summary?.weight_change

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Current Program Week */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Target Program
            </p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              Week {currentWeek} <span className="text-xs font-normal text-slate-500">(2-3 Wk Plan)</span>
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Active 2-3 Week Cycle</span>
        </div>
      </div>

      {/* Workout Progress */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Workouts Done
            </p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {completed} <span className="text-sm font-normal text-slate-500">/ {totalWorkouts} logged</span>
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Dumbbell className="h-3.5 w-3.5 text-emerald-500" />
          <span>Keep up the daily consistency</span>
        </div>
      </div>

      {/* Daily Diet Avg */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Daily Intake
            </p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {avgCals > 0 ? `${avgCals} kcal` : 'No logs'}
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Utensils className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Diet & Nutrition status</span>
        </div>
      </div>

      {/* Weight Logged */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Latest Weight
            </p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {weight !== null && weight !== undefined ? `${weight} kg` : 'Not set'}
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
            <Scale className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {weightChange !== null && weightChange !== undefined ? (
            <span className={weightChange <= 0 ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
              {weightChange > 0 ? `+${weightChange} kg` : `${weightChange} kg`} change
            </span>
          ) : (
            <span>Track progress over weeks</span>
          )}
        </div>
      </div>
    </div>
  )
}

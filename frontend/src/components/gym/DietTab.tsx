import { useState, useEffect } from 'react'
import { Utensils, Plus, Trash2, Calendar, Flame, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import type { GymDietLog } from '@/types'
import { listDietLogs, createDietLog, deleteDietLog } from '@/services/gym'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export function DietTab({ onDietChange }: { onDietChange: () => void }) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  )
  const [logs, setLogs] = useState<GymDietLog[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mealType, setMealType] = useState('Breakfast')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('400')
  const [protein, setProtein] = useState('30')
  const [carbs, setCarbs] = useState('40')
  const [fat, setFat] = useState('10')

  // Calorie & Macro Target Goals
  const calorieTarget = 2200
  const proteinTarget = 150

  const fetchDietLogs = async () => {
    try {
      const data = await listDietLogs(selectedDate)
      setLogs(data)
    } catch (err) {
      console.error('Failed to fetch diet logs:', err)
    }
  }

  useEffect(() => {
    fetchDietLogs()
  }, [selectedDate])

  const handleCreateDietLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foodName.trim()) return

    try {
      await createDietLog({
        date: selectedDate,
        meal_type: mealType,
        food_name: foodName.trim(),
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
      })
      setIsModalOpen(false)
      setFoodName('')
      fetchDietLogs()
      onDietChange()
    } catch (err) {
      console.error('Failed to create diet log:', err)
    }
  }

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteDietLog(id)
      fetchDietLogs()
      onDietChange()
    } catch (err) {
      console.error('Failed to delete diet log:', err)
    }
  }

  // Totals calculation
  const totalCalories = logs.reduce((acc, log) => acc + (log.calories || 0), 0)
  const totalProtein = logs.reduce((acc, log) => acc + (log.protein_g || 0), 0)
  const totalCarbs = logs.reduce((acc, log) => acc + (log.carbs_g || 0), 0)
  const totalFat = logs.reduce((acc, log) => acc + (log.fat_g || 0), 0)

  const calPct = Math.min(100, Math.round((totalCalories / calorieTarget) * 100))
  const protPct = Math.min(100, Math.round((totalProtein / proteinTarget) * 100))

  return (
    <div className="space-y-6">
      {/* Date selector & Add food button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Log Meal / Food</span>
        </Button>
      </div>

      {/* Macro Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calories Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" /> Daily Calories Goal
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {totalCalories} / {calorieTarget} kcal ({calPct}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${calPct}%` }}
            />
          </div>
        </div>

        {/* Protein Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" /> Daily Protein Goal
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {totalProtein}g / {proteinTarget}g ({protPct}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 transition-all duration-500"
              style={{ width: `${protPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Macro Totals Pill */}
      <div className="flex flex-wrap items-center justify-around gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 text-center">
        <div>
          <p className="text-xs text-slate-500">Total Calories</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{totalCalories} kcal</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Protein</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalProtein}g</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Carbs</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{totalCarbs}g</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Fat</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalFat}g</p>
        </div>
      </div>

      {/* Meal Grouped Lists */}
      <div className="space-y-4">
        {MEAL_TYPES.map((type) => {
          const mealLogs = logs.filter((l) => l.meal_type === type)
          const mealCals = mealLogs.reduce((a, b) => a + (b.calories || 0), 0)

          return (
            <div
              key={type}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-slate-500" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{type}</h4>
                  <span className="text-xs text-slate-500">({mealLogs.length} items)</span>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {mealCals} kcal
                </span>
              </div>

              {mealLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No items logged for {type} yet.</p>
              ) : (
                <div className="space-y-2">
                  {mealLogs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/60"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.food_name}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Protein: {item.protein_g}g | Carbs: {item.carbs_g}g | Fat: {item.fat_g}g
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {item.calories} kcal
                        </span>
                        <button
                          onClick={() => handleDeleteLog(item.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal for adding food */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Meal / Food Item">
        <form onSubmit={handleCreateDietLog} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meal Type
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Food / Item Name"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="e.g. Oatmeal with Whey Protein & Banana"
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Calories (kcal)"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required
            />
            <Input
              label="Protein (g)"
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Diet Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

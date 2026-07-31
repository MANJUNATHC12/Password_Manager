import { useState, useEffect } from 'react'
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import type { GymWeightLog } from '@/types'
import { listWeightLogs, createWeightLog, deleteWeightLog } from '@/services/gym'

export function WeightTab({ onWeightChange }: { onWeightChange: () => void }) {
  const [logs, setLogs] = useState<GymWeightLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])
  const [weightKg, setWeightKg] = useState('75.0')
  const [bodyFat, setBodyFat] = useState('')
  const [notes, setNotes] = useState('')

  const fetchWeightLogs = async () => {
    setLoading(true)
    try {
      const data = await listWeightLogs()
      setLogs(data)
    } catch (err) {
      console.error('Failed to fetch weight logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeightLogs()
  }, [])

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weightKg || Number(weightKg) <= 0) return

    try {
      await createWeightLog({
        date: dateStr,
        weight_kg: Number(weightKg),
        body_fat_pct: bodyFat ? Number(bodyFat) : undefined,
        notes: notes.trim() || undefined,
      })
      setIsModalOpen(false)
      fetchWeightLogs()
      onWeightChange()
    } catch (err) {
      console.error('Failed to create weight log:', err)
    }
  }

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteWeightLog(id)
      fetchWeightLogs()
      onWeightChange()
    } catch (err) {
      console.error('Failed to delete weight log:', err)
    }
  }

  const firstWeight = logs.length > 0 ? logs[0].weight_kg : null
  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weight_kg : null
  const weightDiff =
    firstWeight !== null && latestWeight !== null
      ? Number((latestWeight - firstWeight).toFixed(2))
      : 0

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Starting Weight</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {firstWeight !== null ? `${firstWeight} kg` : 'N/A'}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Weight</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {latestWeight !== null ? `${latestWeight} kg` : 'N/A'}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</p>
          <div className="flex items-center gap-2 mt-1">
            {weightDiff < 0 ? (
              <TrendingDown className="h-6 w-6 text-emerald-500" />
            ) : weightDiff > 0 ? (
              <TrendingUp className="h-6 w-6 text-amber-500" />
            ) : (
              <Minus className="h-6 w-6 text-slate-400" />
            )}
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {weightDiff > 0 ? `+${weightDiff} kg` : `${weightDiff} kg`}
            </h3>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Scale className="h-5 w-5 text-purple-500" /> Weight Log History
        </h3>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Log Weight</span>
        </Button>
      </div>

      {/* Logs list / table */}
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">Loading weight logs...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <Scale className="mx-auto h-10 w-10 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            No weight entries logged yet.
          </p>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="mt-3">
            Add First Entry
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Weight</th>
                  <th className="px-4 py-3">Body Fat %</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {log.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">
                      {log.weight_kg} kg
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {log.body_fat_pct ? `${log.body_fat_pct}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {log.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Daily Weight">
        <form onSubmit={handleCreateLog} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
          />

          <Input
            label="Body Fat % (Optional)"
            type="number"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="e.g. 15.5"
          />

          <Input
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Logged morning fast"
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Weight Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

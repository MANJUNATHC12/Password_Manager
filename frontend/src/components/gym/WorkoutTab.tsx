import { useState, useEffect } from 'react'
import {
  Dumbbell,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Flame,
  ListPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { GymWorkout, GymSet, ExercisePreset } from '@/types'
import {
  listWorkouts,
  createWorkout,
  updateWorkout,
  replaceWorkout,
  deleteWorkout,
  getExercisePresets,
} from '@/services/gym'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Cardio']

export function WorkoutTab({ onWorkoutChange }: { onWorkoutChange: () => void }) {
  const [workouts, setWorkouts] = useState<GymWorkout[]>([])
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Chest')
  const [presetExercises, setPresetExercises] = useState<ExercisePreset[]>([])
  const [loadingPresets, setLoadingPresets] = useState<boolean>(false)
  const [loadingWorkouts, setLoadingWorkouts] = useState<boolean>(true)

  // New & Edit Workout Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<GymWorkout | null>(null)
  const [workoutTitle, setWorkoutTitle] = useState('')
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0])
  const [workoutWeek, setWorkoutWeek] = useState(1)
  const [workoutDay, setWorkoutDay] = useState(1)
  const [workoutMuscle, setWorkoutMuscle] = useState('Chest')
  const [selectedExercisesForNew, setSelectedExercisesForNew] = useState<
    Array<{
      exercise_name: string
      muscle_group: string
      sets_data: GymSet[]
    }>
  >([])

  // Custom exercise manual input form inside modal
  const [customName, setCustomName] = useState('')
  const [customSets, setCustomSets] = useState('3')
  const [customReps, setCustomReps] = useState('10')
  const [customWeight, setCustomWeight] = useState('20')

  // Load Workouts
  const fetchWorkouts = async () => {
    setLoadingWorkouts(true)
    try {
      const data = await listWorkouts({ week_number: selectedWeek })
      setWorkouts(data)
    } catch (err) {
      console.error('Failed to fetch workouts:', err)
    } finally {
      setLoadingWorkouts(false)
    }
  }

  useEffect(() => {
    fetchWorkouts()
  }, [selectedWeek])

  // Load Presets when muscle group changes
  const fetchPresetsForMuscle = async (muscle: string) => {
    setLoadingPresets(true)
    try {
      const res = await getExercisePresets(muscle)
      if ('exercises' in res) {
        setPresetExercises(res.exercises)
      }
    } catch (err) {
      console.error('Failed to fetch presets:', err)
    } finally {
      setLoadingPresets(false)
    }
  }

  useEffect(() => {
    fetchPresetsForMuscle(selectedMuscle)
  }, [selectedMuscle])

  const handleMuscleChangeInModal = (muscle: string) => {
    setWorkoutMuscle(muscle)
    fetchPresetsForMuscle(muscle)
    if (!workoutTitle || MUSCLE_GROUPS.some((m) => workoutTitle.includes(m))) {
      setWorkoutTitle(`${muscle} Workout Plan`)
    }
  }

  const openNewWorkoutModal = () => {
    setEditingWorkout(null)
    setWorkoutWeek(selectedWeek)
    setWorkoutDay(1)
    setWorkoutDate(new Date().toISOString().split('T')[0])
    setWorkoutMuscle(selectedMuscle)
    setWorkoutTitle(`${selectedMuscle} Workout Plan`)
    setSelectedExercisesForNew([])
    setCustomName('')
    fetchPresetsForMuscle(selectedMuscle)
    setIsModalOpen(true)
  }

  const openEditWorkoutModal = (workout: GymWorkout) => {
    setEditingWorkout(workout)
    setWorkoutWeek(workout.week_number)
    setWorkoutDay(workout.day_number)
    setWorkoutDate(workout.date)
    setWorkoutMuscle(workout.target_muscle || 'Chest')
    setWorkoutTitle(workout.title)

    // Populate existing exercises into draft
    const mapped = (workout.exercises || []).map((ex) => ({
      exercise_name: ex.exercise_name,
      muscle_group: ex.muscle_group,
      sets_data: ex.sets_data || [
        { set_number: 1, reps: 10, weight_kg: 20, completed: false },
        { set_number: 2, reps: 10, weight_kg: 20, completed: false },
        { set_number: 3, reps: 10, weight_kg: 20, completed: false },
      ],
    }))
    setSelectedExercisesForNew(mapped)
    setCustomName('')
    fetchPresetsForMuscle(workout.target_muscle || 'Chest')
    setIsModalOpen(true)
  }

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workoutTitle.trim()) return

    try {
      const payload = {
        date: workoutDate,
        title: workoutTitle.trim(),
        week_number: workoutWeek,
        day_number: workoutDay,
        target_muscle: workoutMuscle,
        exercises: selectedExercisesForNew,
      }

      if (editingWorkout) {
        await replaceWorkout(editingWorkout.id, payload)
      } else {
        await createWorkout(payload)
      }

      setIsModalOpen(false)
      setEditingWorkout(null)
      fetchWorkouts()
      onWorkoutChange()
    } catch (err) {
      console.error('Failed to save workout plan:', err)
    }
  }

  const toggleWorkoutCompletion = async (workout: GymWorkout) => {
    try {
      await updateWorkout(workout.id, { completed: !workout.completed })
      fetchWorkouts()
      onWorkoutChange()
    } catch (err) {
      console.error('Failed to toggle completion:', err)
    }
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return
    try {
      await deleteWorkout(workoutId)
      fetchWorkouts()
      onWorkoutChange()
    } catch (err) {
      console.error('Failed to delete workout:', err)
    }
  }

  // Add preset exercise to draft manually
  const addPresetToDraft = (preset: ExercisePreset) => {
    if (selectedExercisesForNew.some((e) => e.exercise_name === preset.name)) return
    setSelectedExercisesForNew((prev) => [
      ...prev,
      {
        exercise_name: preset.name,
        muscle_group: preset.muscle,
        sets_data: Array.from({ length: preset.default_sets }, (_, idx) => ({
          set_number: idx + 1,
          reps: preset.default_reps,
          weight_kg: preset.default_weight,
          completed: false,
        })),
      },
    ])
  }

  // Add custom manual exercise to draft
  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim()) return

    const numSets = Math.max(1, Number(customSets) || 3)
    const numReps = Math.max(1, Number(customReps) || 10)
    const numWeight = Math.max(0, Number(customWeight) || 0)

    setSelectedExercisesForNew((prev) => [
      ...prev,
      {
        exercise_name: customName.trim(),
        muscle_group: workoutMuscle,
        sets_data: Array.from({ length: numSets }, (_, idx) => ({
          set_number: idx + 1,
          reps: numReps,
          weight_kg: numWeight,
          completed: false,
        })),
      },
    ])
    setCustomName('')
  }

  // Live exercise editing in draft list
  const updateDraftExerciseSets = (index: number, numSets: number) => {
    const count = Math.max(1, numSets || 1)
    setSelectedExercisesForNew((prev) =>
      prev.map((ex, idx) => {
        if (idx !== index) return ex
        const currentReps = ex.sets_data[0]?.reps || 10
        const currentWeight = ex.sets_data[0]?.weight_kg || 0
        const newSets: GymSet[] = Array.from({ length: count }, (_, i) => ({
          set_number: i + 1,
          reps: currentReps,
          weight_kg: currentWeight,
          completed: false,
        }))
        return { ...ex, sets_data: newSets }
      }),
    )
  }

  const updateDraftExerciseReps = (index: number, numReps: number) => {
    const reps = Math.max(1, numReps || 1)
    setSelectedExercisesForNew((prev) =>
      prev.map((ex, idx) => {
        if (idx !== index) return ex
        const newSets = (ex.sets_data || []).map((s) => ({ ...s, reps }))
        return { ...ex, sets_data: newSets }
      }),
    )
  }

  const updateDraftExerciseWeight = (index: number, numWeight: number) => {
    const weight_kg = Math.max(0, numWeight || 0)
    setSelectedExercisesForNew((prev) =>
      prev.map((ex, idx) => {
        if (idx !== index) return ex
        const newSets = (ex.sets_data || []).map((s) => ({ ...s, weight_kg }))
        return { ...ex, sets_data: newSets }
      }),
    )
  }

  const updateDraftExerciseName = (index: number, name: string) => {
    setSelectedExercisesForNew((prev) =>
      prev.map((ex, idx) => (idx === index ? { ...ex, exercise_name: name } : ex)),
    )
  }

  const removeExerciseFromNewDraft = (index: number) => {
    setSelectedExercisesForNew((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* 2-3 Week Navigation & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Week Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Week:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[1, 2, 3, 4].map((wk) => (
              <button
                key={wk}
                onClick={() => setSelectedWeek(wk)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedWeek === wk
                    ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                Week {wk}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={openNewWorkoutModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Create Custom Workout Plan</span>
        </Button>
      </div>

      {/* Muscle Group Exercises Library */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Exercise Library by Muscle Group
            </h3>
          </div>
          <span className="text-xs text-slate-500">Pick exercises to build your workout</span>
        </div>

        {/* Muscle Group Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {MUSCLE_GROUPS.map((muscle) => (
            <button
              key={muscle}
              onClick={() => setSelectedMuscle(muscle)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                selectedMuscle === muscle
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Dumbbell className="h-3.5 w-3.5" />
              {muscle}
            </button>
          ))}
        </div>

        {/* Exercise Cards */}
        {loadingPresets ? (
          <div className="py-6 text-center text-sm text-slate-500">Loading exercise library...</div>
        ) : (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Selectable {selectedMuscle} Exercises ({presetExercises.length} available):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {presetExercises.map((preset) => (
                <div
                  key={preset.name}
                  className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 hover:border-primary-300 hover:bg-primary-50/30 transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-primary-700"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {preset.default_sets} sets × {preset.default_reps} reps ({preset.default_weight} kg)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      openNewWorkoutModal()
                      addPresetToDraft(preset)
                    }}
                    className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    <Plus className="h-3.5 w-3.5" /> Select Exercise
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Week Workouts List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" /> Week {selectedWeek} Active Routines
          </h3>
          <span className="text-xs text-slate-500">
            {workouts.length} workout(s) logged
          </span>
        </div>

        {loadingWorkouts ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading workouts...</div>
        ) : workouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <Dumbbell className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No workouts planned for Week {selectedWeek} yet.
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Click below to manually select your exercises and build a workout plan!
            </p>
            <Button onClick={openNewWorkoutModal} size="sm">
              Create Week {selectedWeek} Workout Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className={`rounded-2xl border p-5 transition-all ${
                  workout.completed
                    ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={workout.completed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : ''}>
                        Week {workout.week_number} • Day {workout.day_number}
                      </Badge>
                      {workout.target_muscle && (
                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{workout.target_muscle}</Badge>
                      )}
                    </div>
                    <h4 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                      {workout.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Date: {workout.date}</p>
                  </div>

                  {/* Actions: Edit, Toggle Completion, Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditWorkoutModal(workout)}
                      title="Edit Workout Plan"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-primary-400 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleWorkoutCompletion(workout)}
                      title={workout.completed ? 'Mark incomplete' : 'Mark completed'}
                      className="text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      {workout.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Exercises list in workout */}
                {workout.exercises && workout.exercises.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Selected Exercises ({workout.exercises.length})
                    </p>
                    {workout.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {ex.exercise_name}
                          </span>
                          <span className="ml-2 text-slate-500">({ex.muscle_group})</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 font-mono">
                          {ex.sets_data ? `${ex.sets_data.length} sets × ${ex.sets_data[0]?.reps || 10} reps (${ex.sets_data[0]?.weight_kg || 0} kg)` : '3 sets'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New & Edit Workout Creation Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingWorkout(null)
        }}
        title={editingWorkout ? `Edit Workout Plan: ${editingWorkout.title}` : 'Build Custom Workout Plan'}
      >
        <form onSubmit={handleSaveWorkout} className="space-y-4">
          <Input
            label="Workout Plan Title"
            value={workoutTitle}
            onChange={(e) => setWorkoutTitle(e.target.value)}
            placeholder="e.g. Chest & Triceps Workout"
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Muscle Group
              </label>
              <select
                value={workoutMuscle}
                onChange={(e) => handleMuscleChangeInModal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Week #
              </label>
              <select
                value={workoutWeek}
                onChange={(e) => setWorkoutWeek(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {[1, 2, 3, 4].map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Day #
              </label>
              <select
                value={workoutDay}
                onChange={(e) => setWorkoutDay(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 1: Quick Pick Exercises from Library */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <ListPlus className="h-4 w-4 text-primary-600" />
              Pick {workoutMuscle} Exercises:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {presetExercises.map((preset) => {
                const isSelected = selectedExercisesForNew.some((e) => e.exercise_name === preset.name)
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => addPresetToDraft(preset)}
                    disabled={isSelected}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 opacity-60 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-white text-slate-700 hover:bg-primary-50 hover:text-primary-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {isSelected ? `✓ ${preset.name}` : `+ ${preset.name}`}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Manual / Custom Exercise Entry */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Or Add Custom Manual Exercise:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div className="col-span-2 sm:col-span-2">
                <input
                  type="text"
                  placeholder="Exercise Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Sets"
                  value={customSets}
                  onChange={(e) => setCustomSets(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Reps"
                  value={customReps}
                  onChange={(e) => setCustomReps(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Kg"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddCustomExercise}
                  className="w-full rounded-lg bg-primary-600 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Selected Exercises Draft List with Interactive Inline Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Selected Exercises ({selectedExercisesForNew.length}):
              </label>
              {selectedExercisesForNew.length === 0 && (
                <span className="text-xs text-amber-500">No exercises added yet.</span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {selectedExercisesForNew.map((ex, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/80"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={ex.exercise_name}
                      onChange={(e) => updateDraftExerciseName(idx, e.target.value)}
                      className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeExerciseFromNewDraft(idx)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Remove exercise"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-slate-500">Sets:</span>
                      <input
                        type="number"
                        min="1"
                        value={ex.sets_data.length}
                        onChange={(e) => updateDraftExerciseSets(idx, Number(e.target.value))}
                        className="w-12 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-slate-500">Reps:</span>
                      <input
                        type="number"
                        min="1"
                        value={ex.sets_data[0]?.reps || 10}
                        onChange={(e) => updateDraftExerciseReps(idx, Number(e.target.value))}
                        className="w-12 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-slate-500">Kg:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={ex.sets_data[0]?.weight_kg || 0}
                        onChange={(e) => updateDraftExerciseWeight(idx, Number(e.target.value))}
                        className="w-16 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingWorkout(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={selectedExercisesForNew.length === 0}>
              {editingWorkout ? 'Update Workout Plan' : 'Save Workout Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

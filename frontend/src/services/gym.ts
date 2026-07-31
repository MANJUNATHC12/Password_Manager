import api from './api'
import type {
  GymWorkout,
  ExercisePreset,
  GymDietLog,
  GymWeightLog,
  GymSummary,
  GymExercise,
} from '@/types'

export async function getExercisePresets(
  muscle_group?: string,
): Promise<Record<string, ExercisePreset[]> | { muscle_group: string; exercises: ExercisePreset[] }> {
  const { data } = await api.get('/gym/exercises/presets', {
    params: muscle_group ? { muscle_group } : undefined,
  })
  return data
}

export async function listWorkouts(params?: {
  week_number?: number
  target_muscle?: string
}): Promise<GymWorkout[]> {
  const { data } = await api.get<GymWorkout[]>('/gym/workouts', { params })
  return data
}

export async function createWorkout(payload: {
  date: string
  title: string
  week_number: number
  day_number: number
  target_muscle?: string
  notes?: string
  exercises?: Array<{
    exercise_name: string
    muscle_group: string
    sets_data: Array<{ set_number: number; reps: number; weight_kg: number; completed: boolean }>
    notes?: string
  }>
}): Promise<GymWorkout> {
  const { data } = await api.post<GymWorkout>('/gym/workouts', payload)
  return data
}

export async function updateWorkout(
  workoutId: string,
  payload: Partial<{
    title: string
    week_number: number
    day_number: number
    target_muscle: string
    notes: string
    completed: boolean
  }>,
): Promise<GymWorkout> {
  const { data } = await api.patch<GymWorkout>(`/gym/workouts/${workoutId}`, payload)
  return data
}

export async function replaceWorkout(
  workoutId: string,
  payload: {
    date: string
    title: string
    week_number: number
    day_number: number
    target_muscle?: string
    notes?: string
    exercises?: Array<{
      exercise_name: string
      muscle_group: string
      sets_data: Array<{ set_number: number; reps: number; weight_kg: number; completed: boolean }>
      notes?: string
    }>
  },
): Promise<GymWorkout> {
  const { data } = await api.put<GymWorkout>(`/gym/workouts/${workoutId}`, payload)
  return data
}

export async function addExerciseToWorkout(
  workoutId: string,
  payload: {
    exercise_name: string
    muscle_group: string
    sets_data: Array<{ set_number: number; reps: number; weight_kg: number; completed: boolean }>
    notes?: string
  },
): Promise<GymExercise> {
  const { data } = await api.post<GymExercise>(`/gym/workouts/${workoutId}/exercises`, payload)
  return data
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  await api.delete(`/gym/workouts/${workoutId}`)
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  await api.delete(`/gym/exercises/${exerciseId}`)
}

// ─── Diet ─────────────────────────────────────────────────────────────

export async function listDietLogs(target_date?: string): Promise<GymDietLog[]> {
  const { data } = await api.get<GymDietLog[]>('/gym/diet', {
    params: target_date ? { target_date } : undefined,
  })
  return data
}

export async function createDietLog(payload: {
  date: string
  meal_type: string
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  notes?: string
}): Promise<GymDietLog> {
  const { data } = await api.post<GymDietLog>('/gym/diet', payload)
  return data
}

export async function deleteDietLog(logId: string): Promise<void> {
  await api.delete(`/gym/diet/${logId}`)
}

// ─── Weight ────────────────────────────────────────────────────────────

export async function listWeightLogs(): Promise<GymWeightLog[]> {
  const { data } = await api.get<GymWeightLog[]>('/gym/weight')
  return data
}

export async function createWeightLog(payload: {
  date: string
  weight_kg: number
  body_fat_pct?: number
  notes?: string
}): Promise<GymWeightLog> {
  const { data } = await api.post<GymWeightLog>('/gym/weight', payload)
  return data
}

export async function deleteWeightLog(logId: string): Promise<void> {
  await api.delete(`/gym/weight/${logId}`)
}

// ─── Summary ───────────────────────────────────────────────────────────

export async function getGymSummary(): Promise<GymSummary> {
  const { data } = await api.get<GymSummary>('/gym/summary')
  return data
}

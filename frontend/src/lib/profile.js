import { daySeries, weightTrend } from './nutrition.js'

const roundTo = (value, step = 1) => Math.round((Number(value) || 0) / step) * step
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0))

export const profileDefaults = () => ({
  completed: false,
  skipped: false,
  age: null,
  sex: 'male',
  heightCm: null,
  weightKg: null,
  targetWeightKg: null,
  activity: 'moderate',
  steps: 7000,
  trainingDays: 3,
  sessionMinutes: 60,
  experience: 'beginner',
  equipment: ['bodyweight'],
  goal: 'maintain',
  targetRateKgWeek: 0.25,
  calisthenicsGoals: ['pullup'],
  dietStyle: 'balanced',
  intolerances: '',
  injuries: '',
  pregnant: false,
  breastfeeding: false,
  recovery: [],
  checkins: [],
  measurements: [],
  targetHistory: [],
  coachApplications: [],
})

export function normalizeProfile(value) {
  const base = profileDefaults()
  const profile = value && typeof value === 'object' ? value : {}
  return {
    ...base,
    ...profile,
    equipment: Array.isArray(profile.equipment) ? profile.equipment : base.equipment,
    calisthenicsGoals: Array.isArray(profile.calisthenicsGoals) ? profile.calisthenicsGoals : base.calisthenicsGoals,
    recovery: Array.isArray(profile.recovery) ? profile.recovery : [],
    checkins: Array.isArray(profile.checkins) ? profile.checkins : [],
    measurements: Array.isArray(profile.measurements) ? profile.measurements : [],
    targetHistory: Array.isArray(profile.targetHistory) ? profile.targetHistory : [],
    coachApplications: Array.isArray(profile.coachApplications) ? profile.coachApplications : [],
  }
}

const ACTIVITY = {
  low: 1.25,
  light: 1.4,
  moderate: 1.55,
  high: 1.72,
  athlete: 1.88,
}

/**
 * Conservative starting targets. They are a starting hypothesis, not a diagnosis: the coach
 * only adapts them after several weeks of sufficiently complete logs and always asks first.
 */
export function estimateTargets(value) {
  const profile = normalizeProfile(value)
  const age = Number(profile.age)
  const height = Number(profile.heightCm)
  const weight = Number(profile.weightKg)
  const reasons = []
  if (!(age >= 18 && age <= 90)) reasons.push('adult_age_required')
  if (!(height >= 120 && height <= 230)) reasons.push('height_required')
  if (!(weight >= 35 && weight <= 300)) reasons.push('weight_required')
  if (profile.pregnant || profile.breastfeeding) reasons.push('pregnancy')
  const bmi = height > 0 ? weight / ((height / 100) ** 2) : null
  if (profile.goal === 'lose' && bmi != null && bmi < 18.5) reasons.push('low_bmi')
  if (reasons.length) return { safe: false, reasons, bmi: bmi ? Math.round(bmi * 10) / 10 : null }

  const sexConstant = profile.sex === 'female' ? -161 : profile.sex === 'male' ? 5 : -78
  const bmr = 10 * weight + 6.25 * height - 5 * age + sexConstant
  const maintenance = roundTo(bmr * (ACTIVITY[profile.activity] || ACTIVITY.moderate), 25)
  const requestedRate = clamp(profile.targetRateKgWeek, 0.1, profile.goal === 'lose' ? 0.75 : 0.5)
  const weeklyEnergy = requestedRate * 7700 / 7
  let calories = maintenance
  if (profile.goal === 'gain') calories += clamp(weeklyEnergy, 150, 500)
  if (profile.goal === 'lose') calories -= Math.min(clamp(weeklyEnergy, 200, 750), maintenance * 0.2)
  calories = roundTo(Math.max(1200, calories), 25)

  const proteinLow = roundTo(weight * (profile.goal === 'lose' ? 1.6 : 1.4), 5)
  const proteinHigh = roundTo(weight * 2, 5)
  const protein = roundTo(weight * (profile.goal === 'lose' ? 1.8 : 1.7), 5)
  const fat = roundTo(Math.max(weight * 0.8, calories * 0.22 / 9), 5)
  const carbs = roundTo(Math.max(0, (calories - protein * 4 - fat * 9) / 4), 5)
  const fiber = roundTo(calories / 1000 * 14, 1)
  const waterMl = roundTo(clamp(weight * 35, 1500, 5000), 250)
  return {
    safe: true,
    bmi: Math.round(bmi * 10) / 10,
    bmr: roundTo(bmr, 1),
    maintenance,
    calories,
    protein,
    proteinRange: [proteinLow, proteinHigh],
    carbs,
    fat,
    fiber,
    waterMl,
    rateKgWeek: requestedRate,
  }
}

export function adaptiveEnergyEstimate(state, now = new Date()) {
  const rows = daySeries(state, 21, now).filter(row => row.entries.length > 0)
  const weight = weightTrend(state?.bodyweight || [], 35, now)
  if (rows.length < 14 || weight.points < 5 || weight.kgWeek == null) {
    return { ready: false, loggedDays: rows.length, weighIns: weight.points, confidence: 'low' }
  }
  const averageCalories = rows.reduce((sum, row) => sum + row.calories, 0) / rows.length
  // Useful trend estimate, intentionally bounded. Body-weight change is not pure tissue energy,
  // so this never applies a target by itself.
  const expenditure = clamp(averageCalories - weight.kgWeek * 7700 / 7, 1200, 5000)
  const confidence = rows.length >= 19 && weight.points >= 8 ? 'high' : 'medium'
  return {
    ready: true,
    loggedDays: rows.length,
    weighIns: weight.points,
    averageCalories: roundTo(averageCalories, 1),
    kgWeek: weight.kgWeek,
    expenditure: roundTo(expenditure, 25),
    confidence,
  }
}

export function recoverySummary(value, now = new Date()) {
  const profile = normalizeProfile(value)
  const cutoff = new Date(now).getTime() - 7 * 86400000
  const rows = profile.recovery.filter(row => (Number(row.createdAt) || new Date(`${row.date}T12:00:00`).getTime()) >= cutoff)
  if (!rows.length) return { days: 0, status: 'unknown' }
  const avg = key => Math.round(rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0) / rows.length * 10) / 10
  const sleep = avg('sleepHours')
  const energy = avg('energy')
  const stress = avg('stress')
  const soreness = avg('soreness')
  const pain = Math.max(...rows.map(row => Number(row.pain) || 0))
  const status = pain >= 5 || sleep < 6 || energy <= 2
    ? 'red'
    : pain >= 3 || sleep < 7 || stress >= 4 || soreness >= 4 ? 'yellow' : 'green'
  return { days: rows.length, sleep, energy, stress, soreness, pain, status }
}

export function weeklyCheckinDue(value, now = new Date()) {
  const rows = normalizeProfile(value).checkins
  if (!rows.length) return true
  const latest = Math.max(...rows.map(row => Number(row.createdAt) || 0))
  return new Date(now).getTime() - latest >= 6 * 86400000
}

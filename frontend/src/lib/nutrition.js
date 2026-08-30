const DAY = 86400000

const round = (value, digits = 1) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const isoDate = value => {
  const d = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const nutritionDefaults = () => ({
  goals: {
    mode: 'maintain',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    waterMl: null,
    rateKgWeek: 0.25,
  },
  entries: [],
  foods: [],
  water: [],
  coachHistory: [],
})

export function normalizeNutrition(value) {
  const base = nutritionDefaults()
  const n = value && typeof value === 'object' ? value : {}
  return {
    ...base,
    ...n,
    goals: { ...base.goals, ...(n.goals || {}) },
    entries: Array.isArray(n.entries) ? n.entries : [],
    foods: Array.isArray(n.foods) ? n.foods : [],
    water: Array.isArray(n.water) ? n.water : [],
    coachHistory: Array.isArray(n.coachHistory) ? n.coachHistory : [],
  }
}

export const nutritionOf = state => normalizeNutrition(state?.nutrition)

export function macrosFor(food, grams) {
  const factor = Math.max(0, Number(grams) || 0) / 100
  const per100 = food?.per100 || food || {}
  return {
    calories: round(per100.calories * factor, 0),
    protein: round(per100.protein * factor),
    carbs: round(per100.carbs * factor),
    fat: round(per100.fat * factor),
    fiber: round(per100.fiber * factor),
  }
}

export function totalsForDate(state, date) {
  const n = nutritionOf(state)
  const entries = n.entries.filter(entry => entry.date === date)
  const totals = entries.reduce((sum, entry) => {
    sum.calories += Number(entry.calories) || 0
    sum.protein += Number(entry.protein) || 0
    sum.carbs += Number(entry.carbs) || 0
    sum.fat += Number(entry.fat) || 0
    sum.fiber += Number(entry.fiber) || 0
    return sum
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  const waterMl = n.water
    .filter(entry => entry.date === date)
    .reduce((sum, entry) => sum + (Number(entry.ml) || 0), 0)
  return {
    ...Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, round(value, key === 'calories' ? 0 : 1)])),
    waterMl: round(waterMl, 0),
    entries,
  }
}

export function daySeries(state, days = 14, end = new Date()) {
  const endDate = new Date(end)
  endDate.setHours(12, 0, 0, 0)
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(endDate.getTime() - (days - index - 1) * DAY)
    const iso = isoDate(date)
    return { date: iso, ...totalsForDate(state, iso) }
  })
}

function regressionSlope(points) {
  if (points.length < 2) return null
  const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length
  const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length
  let numerator = 0
  let denominator = 0
  for (const point of points) {
    numerator += (point.x - xMean) * (point.y - yMean)
    denominator += (point.x - xMean) ** 2
  }
  return denominator ? numerator / denominator : null
}

export function weightTrend(bodyweight, days = 28, now = new Date()) {
  const cutoff = new Date(now).getTime() - days * DAY
  const rows = (bodyweight || [])
    .map(row => ({
      x: Number(row.t) || new Date(`${row.d}T12:00:00`).getTime(),
      y: Number(row.w),
      date: row.d,
    }))
    .filter(row => Number.isFinite(row.x) && Number.isFinite(row.y) && row.x >= cutoff)
    .sort((a, b) => a.x - b.x)
  const first = rows[0]
  if (rows.length < 2) return { points: rows.length, latest: first?.y ?? null, kgWeek: null }
  const origin = rows[0].x
  const slope = regressionSlope(rows.map(row => ({ x: (row.x - origin) / DAY, y: row.y })))
  return {
    points: rows.length,
    latest: rows[rows.length - 1].y,
    kgWeek: slope == null ? null : round(slope * 7, 2),
  }
}

const workoutAt = workout => Number(workout?.start) || new Date(`${workout?.d}T12:00:00`).getTime()

function setScore(set) {
  if (!set?.done) return null
  if (Number(set.sec) > 0) return Number(set.sec) + (Number(set.w) || 0) / 100
  const reps = Number(set.r) || 0
  const weight = Number(set.w) || 0
  if (!reps) return null
  return weight > 0 ? weight * (1 + Math.min(reps, 12) / 30) : reps
}

function bestByExercise(workouts) {
  const best = new Map()
  for (const workout of workouts) {
    for (const entry of workout.entries || []) {
      const score = Math.max(0, ...(entry.sets || []).map(setScore).filter(Number.isFinite))
      if (score > (best.get(entry.id) || 0)) best.set(entry.id, score)
    }
  }
  return best
}

export function overloadTrend(workouts, now = new Date()) {
  const stamp = new Date(now).getTime()
  const recent = (workouts || []).filter(workout => workoutAt(workout) >= stamp - 14 * DAY)
  const previous = (workouts || []).filter(workout => {
    const at = workoutAt(workout)
    return at >= stamp - 28 * DAY && at < stamp - 14 * DAY
  })
  const currentBest = bestByExercise(recent)
  const previousBest = bestByExercise(previous)
  let compared = 0
  let improved = 0
  let regressed = 0
  for (const [id, current] of currentBest) {
    const before = previousBest.get(id)
    if (!before) continue
    compared++
    if (current > before * 1.01) improved++
    else if (current < before * 0.97) regressed++
  }
  return { compared, improved, regressed, recentWorkouts: recent.length, previousWorkouts: previous.length }
}

const average = (rows, key) => {
  const withData = rows.filter(row => row.entries.length > 0)
  if (!withData.length) return null
  return round(withData.reduce((sum, row) => sum + (Number(row[key]) || 0), 0) / withData.length, key === 'calories' ? 0 : 1)
}

function statusForTarget(value, target, tolerance = 0.1) {
  if (!(target > 0) || value == null) return 'yellow'
  const ratio = value / target
  if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) return 'green'
  return ratio >= 0.75 && ratio <= 1.3 ? 'yellow' : 'red'
}

export function coachSnapshot(state, now = new Date()) {
  const nutrition = nutritionOf(state)
  const series = daySeries(state, 14, now)
  const loggedDays = series.filter(day => day.entries.length > 0).length
  const avg = {
    calories: average(series, 'calories'),
    protein: average(series, 'protein'),
    carbs: average(series, 'carbs'),
    fat: average(series, 'fat'),
    fiber: average(series, 'fiber'),
    waterMl: average(series, 'waterMl'),
  }
  const weight = weightTrend(state?.bodyweight || [], 28, now)
  const overload = overloadTrend(state?.workouts || [], now)
  const plannedPerWeek = Object.values(state?.week || {}).filter(Boolean).length
  const expected = plannedPerWeek * 2
  const consistency = expected > 0
    ? overload.recentWorkouts / expected
    : overload.recentWorkouts > 0 ? 1 : 0

  const signals = [
    {
      key: 'logging',
      status: loggedDays >= 10 ? 'green' : loggedDays >= 4 ? 'yellow' : 'red',
      value: loggedDays,
    },
    {
      key: 'calories',
      status: loggedDays < 4 ? 'yellow' : statusForTarget(avg.calories, nutrition.goals.calories),
      value: avg.calories,
      target: nutrition.goals.calories,
    },
    {
      key: 'protein',
      status: loggedDays < 4 ? 'yellow' : statusForTarget(avg.protein, nutrition.goals.protein, 0.12),
      value: avg.protein,
      target: nutrition.goals.protein,
    },
    {
      key: 'training',
      status: overload.recentWorkouts === 0 ? 'red' : consistency >= 0.85 ? 'green' : consistency >= 0.5 ? 'yellow' : 'red',
      value: overload.recentWorkouts,
      target: expected || null,
    },
    {
      key: 'overload',
      status: overload.compared < 2 ? 'yellow' : overload.improved > overload.regressed ? 'green' : overload.regressed > overload.improved ? 'red' : 'yellow',
      value: overload,
    },
  ]

  const mode = nutrition.goals.mode
  const rate = Math.max(0.05, Number(nutrition.goals.rateKgWeek) || 0.25)
  let weightStatus = 'yellow'
  if (weight.kgWeek != null) {
    if (mode === 'gain') weightStatus = weight.kgWeek >= rate * 0.5 && weight.kgWeek <= rate * 1.6 ? 'green' : Math.abs(weight.kgWeek - rate) <= rate ? 'yellow' : 'red'
    else if (mode === 'lose') weightStatus = weight.kgWeek <= -rate * 0.5 && weight.kgWeek >= -rate * 1.6 ? 'green' : Math.abs(weight.kgWeek + rate) <= rate ? 'yellow' : 'red'
    else weightStatus = Math.abs(weight.kgWeek) <= rate ? 'green' : Math.abs(weight.kgWeek) <= rate * 2 ? 'yellow' : 'red'
  }
  signals.splice(1, 0, { key: 'weight', status: weightStatus, value: weight.kgWeek, target: mode })

  return {
    generatedAt: new Date(now).toISOString(),
    goal: { ...nutrition.goals },
    loggedDays,
    averages: avg,
    weight,
    training: { ...overload, plannedPerWeek, consistency: round(consistency, 2) },
    signals,
  }
}

export function localCoach(snapshot) {
  const byKey = Object.fromEntries(snapshot.signals.map(signal => [signal.key, signal]))
  const recommendations = []
  if (snapshot.loggedDays < 10) recommendations.push('Track meals consistently before making a larger calorie change.')
  if (byKey.protein.status === 'red') recommendations.push('Plan one reliable protein source for each main meal.')
  if (byKey.training.status === 'red') recommendations.push('Prioritise completing the planned sessions before adding training volume.')
  if (byKey.overload.status === 'red') recommendations.push('Review repeated stalls and consider a smaller load jump, rep progression or a deload.')
  if (byKey.overload.status === 'green') recommendations.push('Progressive overload is moving in the right direction; keep the current core lifts stable.')

  let calorieProposal = null
  const calories = Number(snapshot.goal.calories)
  const measured = snapshot.weight.kgWeek
  const targetRate = Math.max(0.05, Number(snapshot.goal.rateKgWeek) || 0.25)
  if (calories > 0 && measured != null && snapshot.loggedDays >= 10) {
    if (snapshot.goal.mode === 'gain' && measured < targetRate * 0.5) calorieProposal = calories + 100
    if (snapshot.goal.mode === 'gain' && measured > targetRate * 1.6) calorieProposal = Math.max(800, calories - 100)
    if (snapshot.goal.mode === 'lose' && measured > -targetRate * 0.5) calorieProposal = Math.max(800, calories - 100)
    if (snapshot.goal.mode === 'lose' && measured < -targetRate * 1.6) calorieProposal = calories + 100
  }
  if (calorieProposal) recommendations.push(`Consider a small calorie adjustment from ${calories} to ${calorieProposal} kcal and reassess after more trend data.`)

  return {
    source: 'local',
    summary: recommendations.length
      ? recommendations[0]
      : 'Keep collecting consistent training, nutrition and body-weight data.',
    signals: snapshot.signals,
    recommendations,
    nutritionProposal: calorieProposal ? { calories: calorieProposal } : null,
    trainingProposal: null,
  }
}


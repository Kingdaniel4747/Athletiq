import { describe, expect, it } from 'vitest'
import { coachSnapshot, macrosFor, normalizeNutrition, overloadTrend, totalsForDate, weightTrend } from './nutrition.js'

describe('nutrition data', () => {
  it('upgrades missing and partial nutrition state without losing entries', () => {
    const n = normalizeNutrition({ goals: { calories: 2400 }, entries: [{ id: 'x' }] })
    expect(n.goals.calories).toBe(2400)
    expect(n.goals.mode).toBe('maintain')
    expect(n.entries).toHaveLength(1)
    expect(n.water).toEqual([])
  })

  it('scales per-100g values and totals a day', () => {
    expect(macrosFor({ per100: { calories: 250, protein: 20, carbs: 10, fat: 5, fiber: 2 } }, 40)).toEqual({
      calories: 100, protein: 8, carbs: 4, fat: 2, fiber: 0.8,
    })
    const state = { nutrition: {
      entries: [{ date: '2026-08-25', calories: 100, protein: 8 }, { date: '2026-08-25', calories: 50, protein: 2 }],
      water: [{ date: '2026-08-25', ml: 500 }, { date: '2026-08-25', ml: 250 }],
    } }
    expect(totalsForDate(state, '2026-08-25')).toMatchObject({ calories: 150, protein: 10, waterMl: 750 })
  })
})

describe('coach analysis', () => {
  it('uses a regression trend instead of only the last weight jump', () => {
    const rows = Array.from({ length: 8 }, (_, index) => ({
      d: `2026-08-${String(10 + index).padStart(2, '0')}`,
      w: 80 + index * 0.1,
    }))
    expect(weightTrend(rows, 28, new Date('2026-08-18T12:00:00')).kgWeek).toBeCloseTo(0.7, 1)
  })

  it('detects progressive overload across adjacent two-week windows', () => {
    const workout = (d, w) => ({ d, entries: [{ id: 'bench', sets: [{ done: true, w, r: 8 }] }] })
    const trend = overloadTrend([
      workout('2026-07-30', 70),
      workout('2026-08-18', 75),
    ], new Date('2026-08-25T12:00:00'))
    expect(trend).toMatchObject({ compared: 1, improved: 1, regressed: 0 })
  })

  it('keeps sparse data yellow instead of pretending to know', () => {
    const snapshot = coachSnapshot({ nutrition: { goals: { calories: 2200, protein: 150 } }, workouts: [], bodyweight: [] }, new Date('2026-08-25T12:00:00'))
    expect(snapshot.signals.find(signal => signal.key === 'protein').status).toBe('yellow')
    expect(snapshot.signals.find(signal => signal.key === 'weight').status).toBe('yellow')
  })
})

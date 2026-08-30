import { describe, expect, it } from 'vitest'
import { adaptiveEnergyEstimate, estimateTargets, recoverySummary, weeklyCheckinDue } from './profile.js'

describe('personal targets', () => {
  it('builds bounded starting targets and a protein range', () => {
    const result = estimateTargets({ age: 30, sex: 'male', heightCm: 180, weightKg: 80, activity: 'moderate', goal: 'gain', targetRateKgWeek: 0.25 })
    expect(result.safe).toBe(true)
    expect(result.calories).toBeGreaterThan(result.maintenance)
    expect(result.proteinRange[0]).toBeLessThanOrEqual(result.protein)
    expect(result.proteinRange[1]).toBeGreaterThanOrEqual(result.protein)
  })

  it('does not calculate weight-loss targets for protected cases', () => {
    expect(estimateTargets({ age: 17, heightCm: 170, weightKg: 60, goal: 'lose' }).safe).toBe(false)
    expect(estimateTargets({ age: 30, heightCm: 170, weightKg: 50, goal: 'lose' }).reasons).toContain('low_bmi')
    expect(estimateTargets({ age: 30, heightCm: 170, weightKg: 70, pregnant: true }).reasons).toContain('pregnancy')
  })
})

describe('adaptive data gates', () => {
  it('waits for enough complete nutrition and weight data', () => {
    expect(adaptiveEnergyEstimate({ nutrition: { entries: [] }, bodyweight: [] }, new Date('2026-08-30')).ready).toBe(false)
  })

  it('summarises recovery without inventing a precise score', () => {
    const now = new Date('2026-08-30T12:00:00')
    const result = recoverySummary({ recovery: [{ date: '2026-08-29', sleepHours: 5.5, energy: 2, stress: 4, soreness: 3, pain: 1 }] }, now)
    expect(result.status).toBe('red')
  })

  it('makes a weekly check-in due after six days', () => {
    expect(weeklyCheckinDue({ checkins: [] })).toBe(true)
    expect(weeklyCheckinDue({ checkins: [{ createdAt: new Date('2026-08-20').getTime() }] }, new Date('2026-08-30'))).toBe(true)
  })
})

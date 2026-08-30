import { describe, expect, it } from 'vitest'
import { currentStage, normalizeCalisthenics, progressionAdvice } from './calisthenics.js'

describe('calisthenics progressions', () => {
  it('migrates an empty profile to useful starter goals', () => {
    expect(normalizeCalisthenics(null).activeGoals).toContain('pullup')
    expect(currentStage(null, 'pullup')[1]).toBe('Body row')
  })

  it('suggests the next variation after two clean target sessions', () => {
    const data = {
      activeGoals: ['pullup'],
      stages: { pullup: 'row' },
      entries: [
        { goalId: 'pullup', stageId: 'row', sets: 3, reps: 12, quality: 4, pain: 0, createdAt: 2 },
        { goalId: 'pullup', stageId: 'row', sets: 3, reps: 13, quality: 4, pain: 0, createdAt: 1 },
      ],
    }
    expect(progressionAdvice(data, 'pullup')).toMatchObject({ status: 'progress', next: ['band-pullup', 'Band-assisted pull-up', 8] })
  })

  it('blocks progression when pain is elevated', () => {
    const data = { stages: { pullup: 'row' }, entries: [{ goalId: 'pullup', stageId: 'row', sets: 3, reps: 20, quality: 5, pain: 5, createdAt: 1 }] }
    expect(progressionAdvice(data, 'pullup').status).toBe('pain')
  })
})

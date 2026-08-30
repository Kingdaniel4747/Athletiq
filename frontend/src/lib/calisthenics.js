export const CALISTHENICS_GOALS = [
  {
    id: 'pullup', name: 'Pull-up', group: 'Pull', metric: 'reps',
    stages: [
      ['row', 'Body row', 12], ['band-pullup', 'Band-assisted pull-up', 8],
      ['negative-pullup', 'Negative pull-up', 5], ['pullup', 'Pull-up', 8],
      ['chest-to-bar', 'Chest-to-bar pull-up', 6], ['weighted-pullup', 'Weighted pull-up', 5],
      ['explosive-pullup', 'Explosive pull-up', 5], ['muscle-up', 'Muscle-up', 3],
    ],
  },
  {
    id: 'pushup', name: 'Push-up', group: 'Push', metric: 'reps',
    stages: [
      ['wall-pushup', 'Wall push-up', 15], ['incline-pushup', 'Incline push-up', 12],
      ['knee-pushup', 'Knee push-up', 10], ['pushup', 'Push-up', 15],
      ['diamond-pushup', 'Diamond push-up', 10], ['archer-pushup', 'Archer push-up', 8],
      ['pseudo-planche-pushup', 'Pseudo planche push-up', 8], ['one-arm-pushup', 'One-arm push-up', 5],
    ],
  },
  {
    id: 'dip', name: 'Dip', group: 'Push', metric: 'reps',
    stages: [
      ['bench-dip', 'Bench dip', 12], ['band-dip', 'Band-assisted dip', 8],
      ['negative-dip', 'Negative dip', 5], ['dip', 'Parallel-bar dip', 10],
      ['ring-dip', 'Ring dip', 6], ['weighted-dip', 'Weighted dip', 5],
    ],
  },
  {
    id: 'squat', name: 'Single-leg squat', group: 'Legs', metric: 'reps',
    stages: [
      ['box-squat', 'Bodyweight box squat', 15], ['split-squat', 'Split squat', 12],
      ['assisted-pistol', 'Assisted pistol squat', 8], ['box-pistol', 'Pistol to box', 6],
      ['pistol', 'Pistol squat', 6], ['weighted-pistol', 'Weighted pistol squat', 5],
    ],
  },
  {
    id: 'handstand', name: 'Handstand', group: 'Skill', metric: 'seconds',
    stages: [
      ['pike-hold', 'Pike hold', 30], ['wall-walk', 'Wall walk', 5],
      ['wall-handstand', 'Wall handstand', 40], ['wall-balance', 'Wall balance drills', 30],
      ['kick-up', 'Freestanding kick-up', 20], ['handstand', 'Freestanding handstand', 30],
      ['handstand-pushup', 'Handstand push-up', 5],
    ],
  },
  {
    id: 'lsit', name: 'L-sit', group: 'Skill', metric: 'seconds',
    stages: [
      ['support-hold', 'Support hold', 30], ['tuck-sit', 'Tuck sit', 20],
      ['one-leg-lsit', 'One-leg L-sit', 15], ['lsit', 'L-sit', 20], ['v-sit', 'V-sit', 10],
    ],
  },
  {
    id: 'frontlever', name: 'Front lever', group: 'Skill', metric: 'seconds',
    stages: [
      ['scapular-pull', 'Scapular pull', 10], ['tuck-front-lever', 'Tuck front lever', 20],
      ['advanced-tuck-front-lever', 'Advanced tuck', 15], ['one-leg-front-lever', 'One-leg front lever', 12],
      ['straddle-front-lever', 'Straddle front lever', 10], ['front-lever', 'Front lever', 8],
    ],
  },
  {
    id: 'planche', name: 'Planche', group: 'Skill', metric: 'seconds',
    stages: [
      ['planche-lean', 'Planche lean', 30], ['tuck-planche', 'Tuck planche', 15],
      ['advanced-tuck-planche', 'Advanced tuck planche', 12], ['straddle-planche', 'Straddle planche', 8],
      ['planche', 'Full planche', 5],
    ],
  },
]

export const GOAL_BY_ID = Object.fromEntries(CALISTHENICS_GOALS.map(goal => [goal.id, goal]))

export const calisthenicsDefaults = () => ({
  activeGoals: ['pullup', 'pushup', 'handstand'],
  stages: {},
  entries: [],
})

export function normalizeCalisthenics(value) {
  const base = calisthenicsDefaults()
  const data = value && typeof value === 'object' ? value : {}
  return {
    ...base,
    ...data,
    activeGoals: Array.isArray(data.activeGoals) ? data.activeGoals.filter(id => GOAL_BY_ID[id]) : base.activeGoals,
    stages: data.stages && typeof data.stages === 'object' ? data.stages : {},
    entries: Array.isArray(data.entries) ? data.entries : [],
  }
}

export function currentStage(data, goalId) {
  const goal = GOAL_BY_ID[goalId]
  if (!goal) return null
  const wanted = normalizeCalisthenics(data).stages[goalId]
  return goal.stages.find(stage => stage[0] === wanted) || goal.stages[0]
}

export function entriesForGoal(data, goalId) {
  return normalizeCalisthenics(data).entries
    .filter(entry => entry.goalId === goalId)
    .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0))
}

export function progressionAdvice(data, goalId) {
  const goal = GOAL_BY_ID[goalId]
  const stage = currentStage(data, goalId)
  if (!goal || !stage) return null
  const rows = entriesForGoal(data, goalId).filter(entry => entry.stageId === stage[0]).slice(0, 3)
  const latest = rows[0]
  const stageIndex = goal.stages.findIndex(item => item[0] === stage[0])
  const next = goal.stages[stageIndex + 1] || null
  if (!latest) return { status: 'start', stage, next, message: 'Log a clean baseline session.' }
  if ((Number(latest.pain) || 0) >= 4) return { status: 'pain', stage, next, message: 'Do not progress while joint or tendon pain is elevated.' }
  if ((Number(latest.quality) || 3) <= 2) return { status: 'repeat', stage, next, message: 'Repeat this level and prioritise range and control.' }
  const achieved = entry => goal.metric === 'seconds'
    ? (Number(entry.holdSec) || 0) >= stage[2]
    : (Number(entry.reps) || 0) >= stage[2] && (Number(entry.sets) || 0) >= 3
  if (next && rows.length >= 2 && achieved(rows[0]) && achieved(rows[1])) {
    return { status: 'progress', stage, next, message: `Two clean sessions reached the target. Test ${next[1]} next.` }
  }
  if (!next && achieved(latest)) return { status: 'mastered', stage, next: null, message: 'Maintain the skill or add load carefully.' }
  return { status: 'build', stage, next, message: `Build toward ${stage[2]} ${goal.metric === 'seconds' ? 'seconds' : 'reps for 3 clean sets'}.` }
}

export function calisthenicsSummary(data) {
  const normalized = normalizeCalisthenics(data)
  return normalized.activeGoals.map(goalId => ({
    goal: GOAL_BY_ID[goalId],
    stage: currentStage(normalized, goalId),
    latest: entriesForGoal(normalized, goalId)[0] || null,
    advice: progressionAdvice(normalized, goalId),
  })).filter(row => row.goal)
}

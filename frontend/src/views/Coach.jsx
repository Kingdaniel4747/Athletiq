import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { allExercises, EXIDX } from '../lib/exercises.js'
import { loadOfWorkouts, MUSCLE_NAME } from '../lib/muscles.js'
import { coachSnapshot, localCoach, normalizeNutrition } from '../lib/nutrition.js'
import { adaptiveEnergyEstimate, normalizeProfile, recoverySummary, weeklyCheckinDue } from '../lib/profile.js'
import { calisthenicsSummary } from '../lib/calisthenics.js'
import { requestCoach } from '../lib/nutritionApi.js'
import { getLang, t } from '../lib/i18n.js'
import { uid } from '../lib/format.js'
import { confirmSheet } from '../sheets.jsx'
import { Button } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'
import { weeklyCheckinSheet } from '../wellnessSheets.jsx'

const DAY = 86400000
const SIGNAL_LABEL = {
  logging: 'Food logging', weight: 'Weight trend', calories: 'Calories', protein: 'Protein',
  training: 'Training consistency', overload: 'Progressive overload',
  recovery: 'Recovery & pain',
}

function exerciseCandidates(state) {
  const currentIds = new Set((state.routines || []).flatMap(routine => (routine.ex || []).map(item => item.id)))
  const selected = []
  const perBodyPart = {}
  for (const exercise of allExercises(state)) {
    const usefulEquipment = ['barbell', 'dumbbell', 'cable', 'body weight', 'leverage machine', 'weighted', 'kettlebell'].includes(exercise.eq)
    if (!currentIds.has(exercise.id) && !usefulEquipment) continue
    const count = perBodyPart[exercise.bp] || 0
    if (!currentIds.has(exercise.id) && count >= 12) continue
    selected.push({ id: exercise.id, name: exercise.n, bodyPart: exercise.bp, equipment: exercise.eq, target: exercise.tg })
    perBodyPart[exercise.bp] = count + 1
    if (selected.length >= 110) break
  }
  return selected
}

function recentMuscleLoad(state) {
  const cutoff = Date.now() - 28 * DAY
  const recent = (state.workouts || []).filter(workout => (Number(workout.start) || new Date(`${workout.d}T12:00:00`).getTime()) >= cutoff)
  return Object.entries(loadOfWorkouts(recent))
    .sort((a, b) => b[1] - a[1])
    .map(([muscle, sets]) => ({ muscle, label: MUSCLE_NAME[muscle] || muscle, effectiveSets: Math.round(sets * 10) / 10 }))
}

function Signal({ signal }) {
  let detail = ''
  if (signal.key === 'logging') detail = t('{0} of 14 days', signal.value)
  if (signal.key === 'weight') detail = signal.value == null ? t('Not enough data') : `${signal.value > 0 ? '+' : ''}${signal.value} kg/${t('week')}`
  if (signal.key === 'calories' || signal.key === 'protein') detail = signal.value == null ? t('Not enough data') : `${signal.value}${signal.key === 'calories' ? ' kcal' : ' g'}${signal.target ? ` / ${signal.target}` : ''}`
  if (signal.key === 'training') detail = signal.target ? `${signal.value} / ${signal.target}` : String(signal.value || 0)
  if (signal.key === 'overload') detail = t('{0} improved · {1} regressed', signal.value?.improved || 0, signal.value?.regressed || 0)
  if (signal.key === 'recovery') detail = signal.value?.days ? t('{0} days · max pain {1}/10', signal.value.days, signal.value.maxPain) : t('No check-ins yet')
  return <div className="coach-signal"><span className={`traffic ${signal.status}`} /><span><b>{t(SIGNAL_LABEL[signal.key] || signal.key)}</b><small>{detail}</small></span></div>
}

export default function Coach() {
  const S = useStore(state => state.S)
  const config = useStore(state => state.config)
  const loadConfig = useStore(state => state.loadConfig)
  const update = useStore(state => state.update)
  const toast = useUI(state => state.toast)
  const snapshot = useMemo(() => ({
    ...coachSnapshot(S),
    adaptiveEnergy: adaptiveEnergyEstimate(S),
    readiness: recoverySummary(S.profile),
    skillProgressions: calisthenicsSummary(S.calisthenics).map(row => ({
      goal: row.goal.name, stage: row.stage[1], status: row.advice.status, message: row.advice.message,
    })),
  }), [S])
  const fallback = useMemo(() => localCoach(snapshot), [snapshot])
  const latest = normalizeNutrition(S.nutrition).coachHistory.at(-1)
  const [result, setResult] = useState(latest || fallback)
  const [busy, setBusy] = useState(false)
  const profile = normalizeProfile(S.profile)
  const checkinDue = weeklyCheckinDue(profile)
  const lastApplication = profile.coachApplications.at(-1)
  const painGate = snapshot.recovery.maxPain >= 4 || Number(snapshot.checkin?.pain) >= 4 || snapshot.calisthenics.pain >= 4

  const run = async () => {
    const cfg = config || await loadConfig()
    if (!cfg?.ai_enabled) {
      setResult(fallback)
      toast(t('Local analysis refreshed. Configure AI_API_URL for AI plan proposals.'))
      return
    }
    setBusy(true)
    try {
      const response = await requestCoach({
        snapshot,
        context: {
          muscleLoad: recentMuscleLoad(S),
          currentPlan: (S.routines || []).map(routine => ({
            name: routine.name,
            exercises: (routine.ex || []).map(item => ({ id: item.id, name: EXIDX[item.id]?.n || item.id, sets: item.sets, reps: item.reps })),
          })),
          candidates: exerciseCandidates(S),
          language: getLang(),
          profile: {
            goal: profile.goal, experience: profile.experience, equipment: profile.equipment,
            trainingDays: profile.trainingDays, sessionMinutes: profile.sessionMinutes,
            injuries: profile.injuries, dietStyle: profile.dietStyle, intolerances: profile.intolerances,
          },
        },
      })
      const next = { ...response.recommendation, source: 'ai', createdAt: Date.now(), signals: snapshot.signals }
      setResult(next)
      update(state => {
        state.nutrition = normalizeNutrition(state.nutrition)
        state.nutrition.coachHistory.push(next)
        state.nutrition.coachHistory = state.nutrition.coachHistory.slice(-20)
      })
      toast(t('Coach analysis ready'))
    } catch (error) {
      setResult(fallback)
      toast(error.message || t('AI coach is not available. Local analysis is shown.'))
    } finally { setBusy(false) }
  }

  const applyNutrition = () => {
    const proposal = result?.nutritionProposal
    if (!proposal) return
    const rows = Object.entries(proposal).filter(([key, value]) => key === 'mode'
      ? ['gain', 'lose', 'maintain'].includes(value)
      : ['calories', 'protein', 'carbs', 'fat', 'fiber'].includes(key) && Number(value) > 0)
    confirmSheet({
      title: t('Apply nutrition proposal?'),
      message: rows.map(([key, value]) => `${t(key[0].toUpperCase() + key.slice(1))}: ${value}`).join(' · '),
      confirmText: t('Apply'),
      onConfirm: () => update(state => {
        state.nutrition = normalizeNutrition(state.nutrition)
        state.profile = normalizeProfile(state.profile)
        const before = { ...state.nutrition.goals }
        for (const [key, value] of rows) state.nutrition.goals[key] = key === 'mode' ? value : Number(value)
        state.nutrition.goalHistory.push({ id: uid(), createdAt: Date.now(), source: 'coach', before, after: { ...state.nutrition.goals }, rationale: proposal.rationale || result?.summary || '' })
        state.nutrition.goalHistory = state.nutrition.goalHistory.slice(-50)
        state.profile.coachApplications.push({ id: uid(), kind: 'nutrition', createdAt: Date.now(), before, after: { ...state.nutrition.goals }, rationale: proposal.rationale || result?.summary || '' })
        state.profile.coachApplications = state.profile.coachApplications.slice(-30)
      }),
    })
  }

  const applyPlan = () => {
    const proposal = result?.trainingProposal
    if (!proposal?.days?.length) return
    if (painGate) return toast(t('A harder plan is blocked while pain is elevated. Log a pain-free check-in first.'))
    confirmSheet({
      title: t('Add proposed training plan?'),
      message: t('The new routines are added and scheduled. Your old routines and workout history stay untouched.'),
      confirmText: t('Add plan'),
      onConfirm: () => update(state => {
        for (const day of proposal.days) {
          const routineId = uid()
          const exercises = (day.exercises || []).filter(item => EXIDX[item.id]).map(item => ({
            id: item.id,
            sets: Math.max(1, Math.min(8, Math.round(Number(item.sets) || 3))),
            reps: Math.max(1, Math.min(50, Math.round(Number(item.reps) || 8))),
            weight: 0,
          }))
          if (!exercises.length) continue
          state.routines.push({ id: routineId, name: String(day.name || proposal.name || 'Coach plan').slice(0, 60), emoji: day.icon || 'sparkles', ex: exercises })
          const weekday = Math.max(0, Math.min(6, Math.round(Number(day.weekday))))
          state.week[weekday] = routineId
        }
      }),
    })
  }

  const undoLast = () => {
    if (!lastApplication) return
    confirmSheet({
      title: t('Undo last coach change?'),
      message: t('The previous targets will be restored. Your diary and workout history stay untouched.'),
      confirmText: t('Undo'),
      onConfirm: () => update(state => {
        state.profile = normalizeProfile(state.profile)
        if (lastApplication.kind === 'nutrition') {
          state.nutrition = normalizeNutrition(state.nutrition)
          state.nutrition.goals = { ...state.nutrition.goals, ...lastApplication.before }
        }
        state.profile.coachApplications = state.profile.coachApplications.filter(item => item.id !== lastApplication.id)
      }),
    })
  }

  return <div className="narrow nutrition-page coach-page">
    <div className="hdr"><div><h1>{t('Coach')}</h1><div className="sub">{t('Training and nutrition in one analysis')}</div></div><span className="header-icon orange"><Icon name="sparkles" /></span></div>

    <div className="card coach-intro">
      <span className="coach-orb"><Icon name="sparkles" /></span>
      <div><span className="eyebrow">{result?.source === 'ai' ? t('AI-assisted') : t('Local analysis')}</span><h2>{result?.summary ? t(result.summary) : t('Collecting your trends')}</h2><p>{t('Nothing is changed automatically. You review every proposal first.')}</p></div>
    </div>

    <div className={'card coach-checkin ' + (checkinDue ? 'due' : '')}>
      <div><span className="eyebrow">{t('Weekly rhythm')}</span><h2>{checkinDue ? t('Your check-in is due') : t('Check-in complete')}</h2><p>{checkinDue ? t('Add the context behind your numbers before the coach proposes a change.') : t('The latest sleep, hunger, energy, stress and pain answers are included.')}</p></div>
      <Button size="sm" variant="tinted" onClick={() => weeklyCheckinSheet()}>{checkinDue ? t('Check in now') : t('Update')}</Button>
    </div>

    {snapshot.adaptiveEnergy.ready && <div className="card adaptive-card"><div><span className="eyebrow">{t('Learned from your trend')}</span><h2>{snapshot.adaptiveEnergy.expenditure} kcal</h2><p>{t('Estimated daily expenditure · {0} confidence. This is shown as a trend hypothesis and is never applied directly.', t(snapshot.adaptiveEnergy.confidence))}</p></div><span className={'confidence ' + snapshot.adaptiveEnergy.confidence}>{t(snapshot.adaptiveEnergy.confidence)}</span></div>}

    <div className="card"><div className="row between"><h2>{t('Your traffic lights')}</h2><span className="small muted">{t('Last 14–28 days')}</span></div><div className="coach-signals">{snapshot.signals.map(signal => <Signal key={signal.key} signal={signal} />)}</div></div>

    <div className="card training-mix-card"><div className="row between"><h2>{t('Training mix')}</h2><span className="small muted">{t('Work sets by intent')}</span></div><div>{Object.entries(snapshot.trainingMix).map(([key, value]) => <span key={key}><b>{value}</b><small>{t(key === 'strength' ? 'Strength' : key === 'hypertrophy' ? 'Muscle' : key === 'skill' ? 'Skill' : 'Prehab')}</small></span>)}</div><p>{t('Skill and prehab work are kept separate from strength and hypertrophy volume.')}</p></div>

    {!!result?.recommendations?.length && <div className="card"><h2>{t('Next actions')}</h2><div className="coach-actions-list">{result.recommendations.map((item, index) => <div key={index}><span>{index + 1}</span><p>{t(item)}</p></div>)}</div></div>}

    {result?.nutritionProposal && <div className="card proposal-card"><div className="proposal-icon"><Icon name="food" /></div><div><span className="eyebrow">{t('Nutrition proposal')}</span><h2>{result.nutritionProposal.calories ? `${result.nutritionProposal.calories} kcal` : t('Macro adjustment')}</h2><p>{result.nutritionProposal.rationale || t('Based on your logged intake, target and weight trend.')}</p></div><Button size="sm" variant="tinted" onClick={applyNutrition}>{t('Review & apply')}</Button></div>}

    {result?.trainingProposal?.days?.length && <div className="card"><div className="row between"><div><span className="eyebrow">{t('Training proposal')}</span><h2>{result.trainingProposal.name || t('New training plan')}</h2></div><Icon name="dumbbell" style={{ color: 'var(--orange)', fontSize: 28 }} /></div><p className="small muted">{result.trainingProposal.rationale}</p><div className="plan-preview">{result.trainingProposal.days.map((day, index) => <div key={index}><b>{day.name}</b><span>{(day.exercises || []).map(item => EXIDX[item.id]?.n || item.id).join(' · ')}</span></div>)}</div>{painGate && <div className="safety-card compact"><Icon name="shield" /><div><b>{t('Progression paused')}</b><p>{t('Pain is elevated, so AthletiQ will not apply a harder plan.')}</p></div></div>}<Button variant="tinted" icon="plus" disabled={painGate} onClick={applyPlan}>{t('Review & add plan')}</Button></div>}

    {lastApplication && <button className="coach-undo" onClick={undoLast}><Icon name="reset" /><span><b>{t('Last coach change')}</b><small>{new Date(lastApplication.createdAt).toLocaleDateString()} · {t('Tap to undo')}</small></span><Icon name="chevronRight" /></button>}

    <Button variant="primary" icon="sparkles" disabled={busy} onClick={run}>{busy ? t('Analysing…') : config?.ai_enabled ? t('Analyse with AI') : t('Refresh local analysis')}</Button>
    <p className="small muted coach-note">{config?.ai_enabled ? t('Only a compact trend summary and exercise candidates are sent to your configured AI provider.') : t('Add AI_API_URL, AI_MODEL and optionally AI_API_KEY to .env to enable generated plans and explanations.')}</p>
  </div>
}

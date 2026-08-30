import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { estimateTargets, normalizeProfile } from '../lib/profile.js'
import { normalizeNutrition } from '../lib/nutrition.js'
import { CALISTHENICS_GOALS, normalizeCalisthenics } from '../lib/calisthenics.js'
import { t } from '../lib/i18n.js'
import { todayISO, uid } from '../lib/format.js'
import { Button, NumberField, Segmented, TextField } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

const EQUIPMENT = [
  ['bodyweight', 'Bodyweight'], ['bar', 'Pull-up bar'], ['rings', 'Rings'],
  ['bands', 'Bands'], ['weights', 'Weights'], ['gym', 'Gym'],
]

function ChoiceChips({ rows, values, onChange, single = false }) {
  const selected = new Set(Array.isArray(values) ? values : [values])
  const toggle = value => {
    if (single) return onChange(value)
    onChange(selected.has(value) ? [...selected].filter(item => item !== value) : [...selected, value])
  }
  return <div className="onboarding-chips">{rows.map(([value, label]) =>
    <button type="button" key={value} className={selected.has(value) ? 'on' : ''} onClick={() => toggle(value)}>{t(label)}</button>)}</div>
}

function TargetPreview({ result }) {
  if (!result.safe) return <div className="safety-card">
    <Icon name="shield" />
    <div><b>{t('Automatic targets paused')}</b><p>{t('AthletiQ will save your profile, but will not calculate calorie changes for minors, pregnancy/breastfeeding or an underweight weight-loss goal. Please use qualified medical guidance.')}</p></div>
  </div>
  return <div className="target-preview">
    <div><span>{t('Calories')}</span><b>{result.calories}</b><small>kcal/{t('day')}</small></div>
    <div><span>{t('Protein')}</span><b>{result.protein}</b><small>{result.proteinRange[0]}–{result.proteinRange[1]} g</small></div>
    <div><span>{t('Carbs')}</span><b>{result.carbs}</b><small>g</small></div>
    <div><span>{t('Fat')}</span><b>{result.fat}</b><small>g</small></div>
    <div><span>{t('Water')}</span><b>{result.waterMl}</b><small>ml</small></div>
    <div><span>{t('Maintenance')}</span><b>{result.maintenance}</b><small>kcal</small></div>
  </div>
}

export default function Onboarding() {
  const nav = useNavigate()
  const S = useStore(state => state.S)
  const update = useStore(state => state.update)
  const toast = useUI(state => state.toast)
  const [step, setStep] = useState(0)
  const currentWeightKg = S.bodyweight?.at(-1)?.w
    ? Number(S.bodyweight.at(-1).w) * (S.unit === 'lb' ? 0.45359237 : 1)
    : null
  const [draft, setDraft] = useState(() => ({
    ...normalizeProfile(S.profile),
    weightKg: S.profile?.weightKg || currentWeightKg,
    goal: S.profile?.goal || normalizeNutrition(S.nutrition).goals.mode || 'maintain',
  }))
  const set = (key, value) => setDraft(valueNow => ({ ...valueNow, [key]: value }))
  const targets = useMemo(() => estimateTargets(draft), [draft])
  const validBody = Number(draft.age) > 0 && Number(draft.heightCm) > 0 && Number(draft.weightKg) > 0

  const skip = () => {
    update(state => { state.profile = { ...normalizeProfile(state.profile), skipped: true } })
    nav('/home', { replace: true })
  }

  const finish = () => {
    update(state => {
      const createdAt = Date.now()
      state.profile = {
        ...normalizeProfile(state.profile),
        ...draft,
        completed: true,
        skipped: false,
        targetHistory: [
          ...normalizeProfile(state.profile).targetHistory,
          ...(targets.safe ? [{ id: uid(), createdAt, source: 'onboarding', ...targets }] : []),
        ].slice(-50),
      }
      state.calisthenics = {
        ...normalizeCalisthenics(state.calisthenics),
        activeGoals: draft.calisthenicsGoals,
      }
      state.nutrition = normalizeNutrition(state.nutrition)
      if (targets.safe) {
        state.nutrition.goals = {
          ...state.nutrition.goals,
          mode: draft.goal,
          calories: targets.calories,
          protein: targets.protein,
          proteinLow: targets.proteinRange[0],
          proteinHigh: targets.proteinRange[1],
          carbs: targets.carbs,
          fat: targets.fat,
          fiber: targets.fiber,
          waterMl: targets.waterMl,
          rateKgWeek: targets.rateKgWeek,
        }
      }
      if (!state.bodyweight.length && draft.weightKg > 0) {
        const displayWeight = S.unit === 'lb' ? draft.weightKg / 0.45359237 : draft.weightKg
        state.bodyweight.push({ id: uid(), d: todayISO(), t: createdAt, w: Math.round(displayWeight * 10) / 10 })
      }
      if (draft.targetWeightKg > 0) state.targetW = Math.round((S.unit === 'lb' ? draft.targetWeightKg / 0.45359237 : draft.targetWeightKg) * 10) / 10
      if (['male', 'female'].includes(draft.sex)) state.body = draft.sex
    })
    toast(t('Your AthletiQ baseline is ready'))
    nav('/home', { replace: true })
  }

  return <div className="narrow onboarding-page">
    <div className="onboarding-top">
      <span className="coach-orb"><Icon name="sparkles" /></span>
      <div><span className="eyebrow">AthletiQ Coach</span><h1>{t('Build your baseline')}</h1><p>{t('One profile connects training, food, recovery and your goal.')}</p></div>
    </div>
    <div className="onboarding-progress">{[0, 1, 2, 3].map(index => <span key={index} className={index <= step ? 'on' : ''} />)}</div>

    {step === 0 && <div className="card onboarding-card">
      <span className="eyebrow">{t('Step 1 of 4')}</span><h2>{t('Body and goal')}</h2>
      <div className="nutrition-form-grid">
        <label className="nutrition-field"><span>{t('Age')}</span><NumberField nullable value={draft.age} onChange={value => set('age', value)} /></label>
        <label className="nutrition-field"><span>{t('Height')}</span><span className="nutrition-input-unit"><NumberField nullable value={draft.heightCm} onChange={value => set('heightCm', value)} /><i>cm</i></span></label>
        <label className="nutrition-field"><span>{t('Current weight')}</span><span className="nutrition-input-unit"><NumberField nullable value={draft.weightKg} onChange={value => set('weightKg', value)} /><i>kg</i></span></label>
        <label className="nutrition-field"><span>{t('Target weight')}</span><span className="nutrition-input-unit"><NumberField nullable value={draft.targetWeightKg} onChange={value => set('targetWeightKg', value)} /><i>kg</i></span></label>
      </div>
      <div className="nutrition-field"><span>{t('Sex used for energy estimate')}</span><Segmented value={draft.sex} onChange={value => set('sex', value)} options={[{ value: 'female', label: t('Female') }, { value: 'male', label: t('Male') }, { value: 'other', label: t('Neutral') }]} /></div>
      <div className="nutrition-field"><span>{t('Goal')}</span><Segmented value={draft.goal} onChange={value => set('goal', value)} options={[{ value: 'lose', label: t('Lose') }, { value: 'maintain', label: t('Maintain') }, { value: 'gain', label: t('Gain') }]} /></div>
      {draft.goal !== 'maintain' && <label className="nutrition-field"><span>{t('Target pace')}</span><span className="nutrition-input-unit"><NumberField value={draft.targetRateKgWeek} onChange={value => set('targetRateKgWeek', value)} /><i>kg/{t('week')}</i></span></label>}
    </div>}

    {step === 1 && <div className="card onboarding-card">
      <span className="eyebrow">{t('Step 2 of 4')}</span><h2>{t('Training reality')}</h2>
      <div className="nutrition-field"><span>{t('Daily activity')}</span><Segmented value={draft.activity} onChange={value => set('activity', value)} options={[
        { value: 'low', label: t('Low') }, { value: 'light', label: t('Light') }, { value: 'moderate', label: t('Moderate') }, { value: 'high', label: t('High') },
      ]} /></div>
      <div className="nutrition-form-grid">
        <label className="nutrition-field"><span>{t('Steps per day')}</span><NumberField value={draft.steps} onChange={value => set('steps', value)} /></label>
        <label className="nutrition-field"><span>{t('Training days')}</span><NumberField value={draft.trainingDays} onChange={value => set('trainingDays', value)} /></label>
        <label className="nutrition-field"><span>{t('Minutes per session')}</span><NumberField value={draft.sessionMinutes} onChange={value => set('sessionMinutes', value)} /></label>
      </div>
      <div className="nutrition-field"><span>{t('Experience')}</span><Segmented value={draft.experience} onChange={value => set('experience', value)} options={[
        { value: 'beginner', label: t('Beginner') }, { value: 'intermediate', label: t('Intermediate') }, { value: 'advanced', label: t('Advanced') },
      ]} /></div>
      <div className="nutrition-field"><span>{t('Available equipment')}</span><ChoiceChips rows={EQUIPMENT} values={draft.equipment} onChange={value => set('equipment', value)} /></div>
    </div>}

    {step === 2 && <div className="card onboarding-card">
      <span className="eyebrow">{t('Step 3 of 4')}</span><h2>{t('Skills, food and safety')}</h2>
      <div className="nutrition-field"><span>{t('Calisthenics goals')}</span><ChoiceChips rows={CALISTHENICS_GOALS.map(goal => [goal.id, goal.name])} values={draft.calisthenicsGoals} onChange={value => set('calisthenicsGoals', value)} /></div>
      <div className="nutrition-field"><span>{t('Eating style')}</span><Segmented value={draft.dietStyle} onChange={value => set('dietStyle', value)} options={[
        { value: 'balanced', label: t('Balanced') }, { value: 'vegetarian', label: t('Vegetarian') }, { value: 'vegan', label: t('Vegan') },
      ]} /></div>
      <label className="nutrition-field"><span>{t('Intolerances or foods to avoid')}</span><TextField value={draft.intolerances} onChange={event => set('intolerances', event.target.value)} /></label>
      <label className="nutrition-field"><span>{t('Injuries or recurring pain')}</span><TextField value={draft.injuries} onChange={event => set('injuries', event.target.value)} placeholder={t('e.g. right elbow tendon')} /></label>
      {draft.sex === 'female' && <div className="onboarding-chips"><button className={draft.pregnant ? 'on' : ''} onClick={() => set('pregnant', !draft.pregnant)}>{t('Pregnant')}</button><button className={draft.breastfeeding ? 'on' : ''} onClick={() => set('breastfeeding', !draft.breastfeeding)}>{t('Breastfeeding')}</button></div>}
    </div>}

    {step === 3 && <div className="card onboarding-card">
      <span className="eyebrow">{t('Step 4 of 4')}</span><h2>{t('Your starting targets')}</h2>
      <p className="muted small">{t('AthletiQ estimates a starting point. Your real weight and intake trends can refine it after at least two consistent weeks; no change is automatic.')}</p>
      <TargetPreview result={targets} />
      <div className="safety-note"><Icon name="info" /><span>{t('This is fitness guidance, not medical care. Stop and seek professional help for injury, eating-disorder concerns, pregnancy or unexplained symptoms.')}</span></div>
    </div>}

    <div className="onboarding-nav">
      {step > 0 ? <Button onClick={() => setStep(value => value - 1)}>{t('Back')}</Button> : <Button variant="ghost" onClick={skip}>{t('Later')}</Button>}
      {step < 3
        ? <Button variant="primary" disabled={step === 0 && !validBody} onClick={() => setStep(value => value + 1)}>{t('Continue')}</Button>
        : <Button variant="primary" icon="check" onClick={finish}>{targets.safe ? t('Use these targets') : t('Save profile')}</Button>}
    </div>
  </div>
}

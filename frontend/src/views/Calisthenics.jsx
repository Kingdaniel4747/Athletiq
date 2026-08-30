import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import {
  CALISTHENICS_GOALS, GOAL_BY_ID, calisthenicsSummary, currentStage,
  normalizeCalisthenics, progressionAdvice,
} from '../lib/calisthenics.js'
import { todayISO, uid } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { Button, NumberField, Segmented, TextField } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

function LogForm({ goalId, close }) {
  const data = normalizeCalisthenics(useStore.getState().S.calisthenics)
  const goal = GOAL_BY_ID[goalId]
  const selected = currentStage(data, goalId)
  const update = useStore(state => state.update)
  const toast = useUI(state => state.toast)
  const [stageId, setStageId] = useState(selected[0])
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(0)
  const [holdSec, setHoldSec] = useState(0)
  const [assistanceKg, setAssistanceKg] = useState(0)
  const [addedKg, setAddedKg] = useState(0)
  const [band, setBand] = useState('')
  const [inclineCm, setInclineCm] = useState(0)
  const [rom, setRom] = useState('full')
  const [tempo, setTempo] = useState('controlled')
  const [quality, setQuality] = useState(4)
  const [rpe, setRpe] = useState(8)
  const [pain, setPain] = useState(0)
  const [side, setSide] = useState('both')
  const [intent, setIntent] = useState(goal.group === 'Skill' ? 'skill' : 'strength')
  const [note, setNote] = useState('')

  const save = () => {
    update(state => {
      state.calisthenics = normalizeCalisthenics(state.calisthenics)
      state.calisthenics.stages[goalId] = stageId
      state.calisthenics.entries.push({
        id: uid(), date: todayISO(), createdAt: Date.now(), goalId, stageId,
        sets, reps, holdSec, assistanceKg, addedKg, band: band.trim(), inclineCm,
        rom, tempo, quality, rpe, pain, side, intent, note: note.trim(),
      })
      state.calisthenics.entries = state.calisthenics.entries.slice(-1000)
    })
    toast(t('Calisthenics session logged'))
    close()
  }

  return <div className="calisthenics-log card">
    <div className="row between"><div><span className="eyebrow">{t('Log progression')}</span><h2>{goal.name}</h2></div><button className="iconbtn" onClick={close}><Icon name="xmark" /></button></div>
    <label className="nutrition-field"><span>{t('Variation / level')}</span><select className="input" value={stageId} onChange={event => setStageId(event.target.value)}>{goal.stages.map(stage => <option key={stage[0]} value={stage[0]}>{stage[1]}</option>)}</select></label>
    <div className="nutrition-form-grid">
      <label className="nutrition-field"><span>{t('Sets')}</span><NumberField value={sets} onChange={setSets} /></label>
      {goal.metric === 'seconds'
        ? <label className="nutrition-field"><span>{t('Best hold')}</span><span className="nutrition-input-unit"><NumberField value={holdSec} onChange={setHoldSec} /><i>s</i></span></label>
        : <label className="nutrition-field"><span>{t('Best reps')}</span><NumberField value={reps} onChange={setReps} /></label>}
      <label className="nutrition-field"><span>{t('Assistance')}</span><span className="nutrition-input-unit"><NumberField value={assistanceKg} onChange={setAssistanceKg} /><i>kg</i></span></label>
      <label className="nutrition-field"><span>{t('Added weight')}</span><span className="nutrition-input-unit"><NumberField value={addedKg} onChange={setAddedKg} /><i>kg</i></span></label>
      <label className="nutrition-field"><span>{t('Incline height')}</span><span className="nutrition-input-unit"><NumberField value={inclineCm} onChange={setInclineCm} /><i>cm</i></span></label>
      <label className="nutrition-field"><span>{t('RPE')}</span><NumberField value={rpe} onChange={setRpe} /></label>
    </div>
    <label className="nutrition-field"><span>{t('Band / lever detail')}</span><TextField value={band} onChange={event => setBand(event.target.value)} placeholder={t('e.g. red band or one-leg tuck')} /></label>
    <div className="nutrition-field"><span>{t('Range of motion')}</span><Segmented value={rom} onChange={setRom} options={[{ value: 'partial', label: t('Partial') }, { value: 'full', label: t('Full') }, { value: 'deficit', label: t('Deficit') }]} /></div>
    <div className="nutrition-field"><span>{t('Tempo')}</span><Segmented value={tempo} onChange={setTempo} options={[{ value: 'fast', label: t('Explosive') }, { value: 'controlled', label: t('Controlled') }, { value: 'slow', label: t('Slow') }]} /></div>
    <div className="nutrition-field"><span>{t('Side')}</span><Segmented value={side} onChange={setSide} options={[{ value: 'both', label: t('Both') }, { value: 'left', label: t('Left') }, { value: 'right', label: t('Right') }]} /></div>
    <div className="nutrition-field"><span>{t('Training intent')}</span><Segmented value={intent} onChange={setIntent} options={[{ value: 'strength', label: t('Strength') }, { value: 'hypertrophy', label: t('Muscle') }, { value: 'skill', label: t('Skill') }, { value: 'prehab', label: t('Prehab') }]} /></div>
    <div className="nutrition-form-grid">
      <label className="nutrition-field"><span>{t('Form quality (1–5)')}</span><NumberField value={quality} onChange={setQuality} /></label>
      <label className="nutrition-field"><span>{t('Joint/tendon pain (0–10)')}</span><NumberField value={pain} onChange={setPain} /></label>
    </div>
    {pain >= 4 && <div className="safety-card compact"><Icon name="shield" /><div><b>{t('Progression paused')}</b><p>{t('Pain at 4/10 or higher blocks a harder-level suggestion. Reduce irritation and seek assessment if it persists.')}</p></div></div>}
    <label className="nutrition-field"><span>{t('Note')}</span><TextField value={note} onChange={event => setNote(event.target.value)} /></label>
    <Button variant="primary" icon="check" onClick={save}>{t('Save session')}</Button>
  </div>
}

export default function Calisthenics() {
  const S = useStore(state => state.S)
  const update = useStore(state => state.update)
  const data = normalizeCalisthenics(S.calisthenics)
  const rows = useMemo(() => calisthenicsSummary(data), [data])
  const [logging, setLogging] = useState(null)
  const [editingGoals, setEditingGoals] = useState(false)

  const toggleGoal = goalId => update(state => {
    state.calisthenics = normalizeCalisthenics(state.calisthenics)
    const active = new Set(state.calisthenics.activeGoals)
    if (active.has(goalId)) active.delete(goalId)
    else active.add(goalId)
    state.calisthenics.activeGoals = [...active]
  })
  const advance = goalId => update(state => {
    state.calisthenics = normalizeCalisthenics(state.calisthenics)
    const next = progressionAdvice(state.calisthenics, goalId)?.next
    if (next) state.calisthenics.stages[goalId] = next[0]
  })

  return <div className="narrow calisthenics-page">
    <div className="hdr"><div><h1>{t('Calisthenics')}</h1><div className="sub">{t('Track the variation, not only the reps')}</div></div><button className="iconbtn" onClick={() => setEditingGoals(value => !value)}><Icon name="target" /></button></div>
    <div className="calisthenics-hero card"><span><Icon name="sparkles" /></span><div><b>{t('Skill-aware overload')}</b><p>{t('Assistance, lever, range, tempo, hold time, form and pain decide what “progress” means.')}</p></div></div>

    {editingGoals && <div className="card"><h2>{t('Choose your goals')}</h2><div className="onboarding-chips">{CALISTHENICS_GOALS.map(goal => <button key={goal.id} className={data.activeGoals.includes(goal.id) ? 'on' : ''} onClick={() => toggleGoal(goal.id)}>{goal.name}</button>)}</div></div>}

    {logging && <LogForm goalId={logging} close={() => setLogging(null)} />}

    <div className="calisthenics-grid">{rows.map(({ goal, stage, latest, advice }) => {
      const stageIndex = goal.stages.findIndex(item => item[0] === stage[0])
      const percent = goal.stages.length > 1 ? stageIndex / (goal.stages.length - 1) * 100 : 100
      return <div className="card skill-card" key={goal.id}>
        <div className="row between"><span className="skill-group">{t(goal.group)}</span><span className={`skill-status ${advice.status}`}>{t(advice.status === 'pain' ? 'Pain gate' : advice.status === 'progress' ? 'Ready to test' : 'Building')}</span></div>
        <h2>{goal.name}</h2><div className="skill-stage">{stage[1]}</div>
        <div className="skill-track"><span style={{ width: `${percent}%` }} /></div>
        <div className="small muted">{t(advice.message)}</div>
        {latest && <div className="skill-last"><span>{t('Last')}</span><b>{goal.metric === 'seconds' ? `${latest.holdSec || 0}s` : `${latest.sets || 0} × ${latest.reps || 0}`}</b><span>{latest.addedKg ? `+${latest.addedKg} kg` : latest.assistanceKg ? `−${latest.assistanceKg} kg` : `RPE ${latest.rpe || '–'}`}</span></div>}
        <div className="row skill-actions"><Button size="sm" icon="plus" onClick={() => setLogging(goal.id)}>{t('Log')}</Button>{advice.status === 'progress' && <Button size="sm" variant="tinted" onClick={() => advance(goal.id)}>{t('Move to next level')}</Button>}</div>
      </div>
    })}</div>
    {!rows.length && <div className="card empty-state"><Icon name="target" /><b>{t('Choose at least one skill goal')}</b><Button size="sm" onClick={() => setEditingGoals(true)}>{t('Choose goals')}</Button></div>}
  </div>
}

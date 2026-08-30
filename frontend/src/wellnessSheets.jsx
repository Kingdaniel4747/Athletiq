import { useState } from 'react'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { normalizeProfile } from './lib/profile.js'
import { todayISO, uid } from './lib/format.js'
import { t } from './lib/i18n.js'
import { Button, NumberField, Segmented, TextField } from './components/ui.jsx'

const ui = () => useUI.getState()
const SCALE = [1, 2, 3, 4, 5].map(value => ({ value, label: String(value) }))

const saveProfile = mut => useStore.getState().update(state => {
  state.profile = normalizeProfile(state.profile)
  mut(state.profile, state)
})

function DailyRecoveryForm({ close }) {
  const profile = normalizeProfile(useStore.getState().S.profile)
  const previous = profile.recovery.find(row => row.date === todayISO()) || {}
  const [sleepHours, setSleepHours] = useState(previous.sleepHours || 7.5)
  const [energy, setEnergy] = useState(previous.energy || 3)
  const [hunger, setHunger] = useState(previous.hunger || 3)
  const [stress, setStress] = useState(previous.stress || 3)
  const [soreness, setSoreness] = useState(previous.soreness || 2)
  const [pain, setPain] = useState(previous.pain || 0)
  const [steps, setSteps] = useState(previous.steps || profile.steps || 7000)
  const [ill, setIll] = useState(!!previous.ill)
  const [note, setNote] = useState(previous.note || '')
  const save = () => {
    saveProfile(next => {
      next.recovery = next.recovery.filter(row => row.date !== todayISO())
      next.recovery.push({ id: previous.id || uid(), date: todayISO(), createdAt: Date.now(), sleepHours, energy, hunger, stress, soreness, pain, steps, ill, note: note.trim() })
      next.recovery = next.recovery.slice(-180)
    })
    ui().toast(t('Recovery check saved')); close()
  }
  const Rating = ({ label, value, onChange }) => <div className="nutrition-field"><span>{label}</span><Segmented value={value} onChange={onChange} options={SCALE} /></div>
  return <>
    <h3>{t('Daily readiness')}</h3>
    <p className="small muted">{t('AthletiQ explains the signals separately instead of inventing one exact recovery score.')}</p>
    <div className="nutrition-form-grid">
      <label className="nutrition-field"><span>{t('Sleep')}</span><span className="nutrition-input-unit"><NumberField value={sleepHours} onChange={setSleepHours} /><i>h</i></span></label>
      <label className="nutrition-field"><span>{t('Steps')}</span><NumberField value={steps} onChange={setSteps} /></label>
    </div>
    <Rating label={t('Energy · low to high')} value={energy} onChange={setEnergy} />
    <Rating label={t('Hunger · low to high')} value={hunger} onChange={setHunger} />
    <Rating label={t('Stress · low to high')} value={stress} onChange={setStress} />
    <Rating label={t('Soreness · low to high')} value={soreness} onChange={setSoreness} />
    <label className="nutrition-field"><span>{t('Joint/tendon pain (0–10)')}</span><NumberField value={pain} onChange={setPain} /></label>
    <div className="nutrition-field"><span>{t('Ill today?')}</span><Segmented value={ill ? 'yes' : 'no'} onChange={value => setIll(value === 'yes')} options={[{ value: 'no', label: t('No') }, { value: 'yes', label: t('Yes') }]} /></div>
    <label className="nutrition-field"><span>{t('Note')}</span><TextField value={note} onChange={event => setNote(event.target.value)} /></label>
    {(pain >= 4 || ill) && <div className="safety-card compact"><div><b>{t('Keep today conservative')}</b><p>{t('Pain or illness is a stop signal for harder progression. Choose rest, technique or an easier pain-free variation.')}</p></div></div>}
    <Button variant="primary" icon="check" onClick={save}>{t('Save check')}</Button>
  </>
}

export const recoverySheet = () => ui().openSheet(close => <DailyRecoveryForm close={close} />)

function WeeklyCheckinForm({ close, onSaved }) {
  const [training, setTraining] = useState(3)
  const [nutrition, setNutrition] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [hunger, setHunger] = useState(3)
  const [sleep, setSleep] = useState(3)
  const [stress, setStress] = useState(3)
  const [pain, setPain] = useState(0)
  const [note, setNote] = useState('')
  const save = () => {
    let row
    saveProfile(profile => {
      row = { id: uid(), date: todayISO(), createdAt: Date.now(), training, nutrition, energy, hunger, sleep, stress, pain, note: note.trim() }
      profile.checkins.push(row)
      profile.checkins = profile.checkins.slice(-104)
    })
    ui().toast(t('Weekly check-in saved')); close(); onSaved?.(row)
  }
  const Rating = ({ label, value, onChange }) => <div className="nutrition-field"><span>{label}</span><Segmented value={value} onChange={onChange} options={SCALE} /></div>
  return <>
    <h3>{t('Weekly check-in')}</h3>
    <p className="small muted">{t('One minute gives the coach context that calories and reps cannot show.')}</p>
    <Rating label={t('Training adherence')} value={training} onChange={setTraining} />
    <Rating label={t('Nutrition adherence')} value={nutrition} onChange={setNutrition} />
    <Rating label={t('Energy')} value={energy} onChange={setEnergy} />
    <Rating label={t('Hunger')} value={hunger} onChange={setHunger} />
    <Rating label={t('Sleep quality')} value={sleep} onChange={setSleep} />
    <Rating label={t('Stress')} value={stress} onChange={setStress} />
    <label className="nutrition-field"><span>{t('Highest joint/tendon pain')}</span><NumberField value={pain} onChange={setPain} /></label>
    <label className="nutrition-field"><span>{t('What felt easy or difficult?')}</span><TextField value={note} onChange={event => setNote(event.target.value)} /></label>
    <Button variant="primary" icon="check" onClick={save}>{t('Save and analyse')}</Button>
  </>
}

export const weeklyCheckinSheet = onSaved => ui().openSheet(close => <WeeklyCheckinForm close={close} onSaved={onSaved} />)

function MeasurementForm({ close }) {
  const [waist, setWaist] = useState(null)
  const [chest, setChest] = useState(null)
  const [arm, setArm] = useState(null)
  const [thigh, setThigh] = useState(null)
  const save = () => {
    saveProfile(profile => {
      profile.measurements.push({ id: uid(), date: todayISO(), createdAt: Date.now(), waist, chest, arm, thigh })
      profile.measurements = profile.measurements.slice(-200)
    })
    ui().toast(t('Measurements saved')); close()
  }
  const Field = ({ label, value, onChange }) => <label className="nutrition-field"><span>{label}</span><span className="nutrition-input-unit"><NumberField nullable value={value} onChange={onChange} /><i>cm</i></span></label>
  return <>
    <h3>{t('Body measurements')}</h3>
    <div className="nutrition-form-grid"><Field label={t('Waist')} value={waist} onChange={setWaist} /><Field label={t('Chest')} value={chest} onChange={setChest} /><Field label={t('Arm')} value={arm} onChange={setArm} /><Field label={t('Thigh')} value={thigh} onChange={setThigh} /></div>
    <p className="small muted">{t('Use the same measurement point and conditions each time. Photos stay local to your device when added later.')}</p>
    <Button variant="primary" icon="check" onClick={save}>{t('Save measurements')}</Button>
  </>
}

export const measurementSheet = () => ui().openSheet(close => <MeasurementForm close={close} />)

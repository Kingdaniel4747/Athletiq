import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { coachSnapshot, daySeries, nutritionOf, weightTrend } from '../lib/nutrition.js'
import { dateLocale, t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import Icon from '../components/Icon.jsx'
import { normalizeProfile } from '../lib/profile.js'
import { measurementSheet } from '../wellnessSheets.jsx'
import { Button } from '../components/ui.jsx'
import { deleteProgressPhoto, listProgressPhotos, saveProgressPhoto } from '../lib/photo-store.js'

export default function NutritionProgress() {
  const S = useStore(state => state.S)
  const user = useStore(state => state.user)
  const nutrition = nutritionOf(S)
  const rows = daySeries(S, 14)
  const snapshot = coachSnapshot(S)
  const weight = weightTrend(S.bodyweight, 28)
  const maxCalories = Math.max(nutrition.goals.calories || 0, ...rows.map(row => row.calories), 1)
  const profile = normalizeProfile(S.profile)
  const latestMeasurement = profile.measurements.at(-1)
  const toast = useUI(state => state.toast)
  const photoInput = useRef(null)
  const photoUrls = useRef([])
  const [photos, setPhotos] = useState([])
  const photoOwner = user?.id || 'guest'
  const refreshPhotos = () => listProgressPhotos(photoOwner).then(rows => {
    photoUrls.current.forEach(url => URL.revokeObjectURL(url))
    const next = rows.map(row => ({ ...row, url: URL.createObjectURL(row.blob) }))
    photoUrls.current = next.map(row => row.url)
    setPhotos(next)
  }).catch(() => {})
  useEffect(() => {
    refreshPhotos()
    return () => photoUrls.current.forEach(url => URL.revokeObjectURL(url))
    // URLs are recreated only when the local photo list changes.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const addPhoto = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try { await saveProgressPhoto(file, photoOwner); await refreshPhotos(); toast(t('Private progress photo saved on this device')) }
    catch (error) { toast(error.message || t('Photo could not be saved')) }
  }
  const removePhoto = async id => {
    await deleteProgressPhoto(id); await refreshPhotos(); toast(t('Photo deleted'))
  }

  return <div className="narrow nutrition-page">
    <div className="hdr"><div><h1>{t('Nutrition progress')}</h1><div className="sub">{t('Trends, not single-day noise')}</div></div><span className="header-icon orange"><Icon name="chartLine" /></span></div>

    <div className="card">
      <div className="row between"><div><div className="small muted">{t('Weight trend')}</div><div className="big">{weight.kgWeek == null ? '–' : `${weight.kgWeek > 0 ? '+' : ''}${fmtNum(weight.kgWeek)}`} <span className="muted" style={{ fontSize: 15 }}>kg/{t('week')}</span></div></div><span className={`traffic large ${snapshot.signals.find(signal => signal.key === 'weight')?.status || 'yellow'}`} /></div>
      <div className="small muted">{weight.points < 2 ? t('Log more body-weight measurements to calculate a stable trend.') : t('Calculated from {0} weigh-ins over the last four weeks.', weight.points)}</div>
    </div>

    <div className="card">
      <div className="row between"><h2>{t('Calories')}</h2><span className="small muted">{t('Last 14 days')}</span></div>
      <div className="calorie-bars">
        {rows.map(row => <div className="calorie-bar-col" key={row.date} title={`${row.date}: ${row.calories} kcal`}>
          <span className={row.entries.length ? '' : 'empty'} style={{ height: `${Math.max(row.entries.length ? 4 : 1, row.calories / maxCalories * 100)}%` }} />
          <small>{new Date(`${row.date}T12:00:00`).toLocaleDateString(dateLocale(), { weekday: 'narrow' })}</small>
        </div>)}
        {nutrition.goals.calories > 0 && <i className="calorie-goal-line" style={{ bottom: `${Math.min(100, nutrition.goals.calories / maxCalories * 100)}%` }} />}
      </div>
      <div className="row between small muted"><span>{t('{0} of 14 days logged', snapshot.loggedDays)}</span><span>{snapshot.averages.calories == null ? '–' : `${snapshot.averages.calories} kcal ${t('average')}`}</span></div>
    </div>

    <div className="tiles nutrition-tiles">
      {[
        ['protein', t('Protein'), snapshot.averages.protein, nutrition.goals.protein, 'g'],
        ['carbs', t('Carbs'), snapshot.averages.carbs, nutrition.goals.carbs, 'g'],
        ['fat', t('Fat'), snapshot.averages.fat, nutrition.goals.fat, 'g'],
        ['water', t('Water'), snapshot.averages.waterMl, nutrition.goals.waterMl, 'ml'],
      ].map(([key, label, value, goal, unit]) => <div className="tile" key={key}>
        <div className="l">{label} · {t('average')}</div><div className="v" style={{ fontSize: 21 }}>{value == null ? '–' : `${fmtNum(value)} ${unit}`}</div>
        <div className="small muted">{goal > 0 ? t('Goal {0} {1}', fmtNum(goal), unit) : t('No goal set')}</div>
      </div>)}
    </div>

    <div className="card measurement-card">
      <div className="row between"><div><h2>{t('Body measurements')}</h2><div className="small muted">{t('Use trends alongside weight, strength and how clothes fit.')}</div></div><Button size="sm" icon="plus" onClick={measurementSheet}>{t('Log')}</Button></div>
      {latestMeasurement ? <div className="measurement-grid">{[
        ['waist', t('Waist')], ['chest', t('Chest')], ['arm', t('Arm')], ['thigh', t('Thigh')],
      ].map(([key, label]) => <div key={key}><span>{label}</span><b>{latestMeasurement[key] || '–'} <small>cm</small></b></div>)}</div> : <div className="empty-measurement">{t('No measurements yet. Keep conditions and measurement points consistent.')}</div>}
    </div>

    <div className="card progress-photo-card">
      <div className="row between"><div><h2>{t('Private progress photos')}</h2><div className="small muted">{t('Stored only in this browser · never synced or sent to the coach')}</div></div><Button size="sm" icon="plus" onClick={() => photoInput.current?.click()}>{t('Add')}</Button></div>
      <input ref={photoInput} type="file" accept="image/*" capture="environment" hidden onChange={addPhoto} />
      {photos.length ? <div className="progress-photo-grid">{photos.slice(0, 6).map(photo => <div key={photo.id}><img src={photo.url} alt={t('Progress on {0}', photo.date)} /><span>{photo.date}</span><button onClick={() => removePhoto(photo.id)} aria-label={t('Delete')}><Icon name="trash" /></button></div>)}</div> : <div className="empty-measurement">{t('Optional: use the same light, distance and pose for useful comparisons.')}</div>}
    </div>

    <div className="card info-card"><Icon name="info" /><p>{t('Water intake is tracked separately from possible water retention. Short-term scale changes are treated as noise until the trend has enough data.')}</p></div>
  </div>
}

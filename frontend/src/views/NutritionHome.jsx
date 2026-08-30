import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { dateLocale, t } from '../lib/i18n.js'
import { fmtNum, todayISO } from '../lib/format.js'
import { nutritionOf, totalsForDate, weightTrend } from '../lib/nutrition.js'
import { addWater, deleteNutritionEntry, foodEntrySheet, nutritionGoalSheet } from '../nutritionSheets.jsx'
import { Button } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']
const LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

function ProgressBar({ value, target, color, label, unit = 'g' }) {
  const pct = target > 0 ? Math.min(100, Math.round(value / target * 100)) : 0
  return <div className="macro-row">
    <div className="row between"><span>{label}</span><span className="small muted">{fmtNum(value)}{unit} {target > 0 && `/ ${fmtNum(target)}${unit}`}</span></div>
    <div className="macro-track"><span style={{ width: `${pct}%`, background: color }} /></div>
  </div>
}

export default function NutritionHome() {
  const nav = useNavigate()
  const S = useStore(state => state.S)
  const nutrition = nutritionOf(S)
  const date = todayISO()
  const totals = totalsForDate(S, date)
  const goals = nutrition.goals
  const caloriePct = goals.calories > 0 ? Math.min(100, Math.round(totals.calories / goals.calories * 100)) : 0
  const remaining = goals.calories > 0 ? Math.round(goals.calories - totals.calories) : null
  const waterPct = goals.waterMl > 0 ? Math.min(100, totals.waterMl / goals.waterMl * 100) : 0
  const weight = weightTrend(S.bodyweight, 28)

  return <div className="narrow nutrition-page">
    <div className="hdr">
      <div><h1>Health</h1><div className="sub">{new Date(`${date}T12:00:00`).toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
      <button className="iconbtn" onClick={nutritionGoalSheet} aria-label={t('Nutrition goals')}><Icon name="target" /></button>
    </div>

    <div className="nutrition-hero card">
      <div className="calorie-ring" style={{ '--p': `${caloriePct * 3.6}deg` }}>
        <div><b>{totals.calories}</b><span>kcal</span></div>
      </div>
      <div className="nutrition-hero-copy">
        <span className="eyebrow">{t(goals.mode === 'gain' ? 'Gain' : goals.mode === 'lose' ? 'Lose' : 'Maintain')}</span>
        <h2>{remaining == null ? t('Set your daily goals') : remaining >= 0 ? t('{0} kcal remaining', remaining) : t('{0} kcal over goal', Math.abs(remaining))}</h2>
        <div className="small muted">{weight.kgWeek == null ? t('More weigh-ins are needed for a trend.') : t('{0} kg per week weight trend', weight.kgWeek > 0 ? `+${weight.kgWeek}` : weight.kgWeek)}</div>
        {!goals.calories && <Button size="sm" variant="tinted" icon="target" onClick={nutritionGoalSheet}>{t('Set goals')}</Button>}
      </div>
    </div>

    <div className="card macro-card">
      <div className="row between"><h2>{t('Macros')}</h2><span className="small muted">{t('Today')}</span></div>
      <ProgressBar value={totals.protein} target={goals.protein} color="var(--orange)" label={t('Protein')} />
      <ProgressBar value={totals.carbs} target={goals.carbs} color="var(--yellow)" label={t('Carbs')} />
      <ProgressBar value={totals.fat} target={goals.fat} color="var(--pink)" label={t('Fat')} />
      <ProgressBar value={totals.fiber} target={goals.fiber} color="var(--teal)" label={t('Fiber')} />
    </div>

    <div className="nutrition-actions">
      <button onClick={() => nav('/nutrition/foods?scan=1')}><span><Icon name="scan" /></span><b>{t('Scan')}</b><small>{t('Barcode')}</small></button>
      <button onClick={() => nav('/nutrition/foods?mealie=1')}><span><Icon name="book" /></span><b>Mealie</b><small>{t('Recipes')}</small></button>
      <button onClick={() => foodEntrySheet()}><span><Icon name="plus" /></span><b>{t('Manual')}</b><small>{t('Food')}</small></button>
    </div>

    <div className="card water-card">
      <div className="water-bottle" aria-label={t('{0} ml water', totals.waterMl)}>
        <span className="cap" /><span className="water-fill" style={{ height: `${waterPct}%` }} /><Icon name="drop" />
      </div>
      <div className="water-copy">
        <div className="row between"><h2>{t('Water')}</h2><b>{totals.waterMl} ml</b></div>
        <div className="small muted">{goals.waterMl ? t('{0} ml remaining', Math.max(0, goals.waterMl - totals.waterMl)) : t('Set an individual drinking target in goals.')}</div>
        <div className="chips water-chips">
          {[250, 500, 750].map(ml => <button className="chip" key={ml} onClick={() => addWater(ml, date)}>+{ml} ml</button>)}
        </div>
      </div>
    </div>

    <div className="row between diary-heading"><h2>{t('Food diary')}</h2><Button size="sm" icon="plus" onClick={() => foodEntrySheet(null, date)}>{t('Add')}</Button></div>
    {MEALS.map(meal => {
      const entries = totals.entries.filter(entry => entry.meal === meal)
      const calories = entries.reduce((sum, entry) => sum + (Number(entry.calories) || 0), 0)
      return <div className="card meal-card" key={meal}>
        <div className="row between meal-title"><h3>{t(LABELS[meal])}</h3><span>{Math.round(calories)} kcal</span></div>
        {entries.length ? entries.map(entry => <div className="food-row" key={entry.id}>
          <span className="food-dot"><Icon name="food" /></span>
          <button className="food-main" onClick={() => foodEntrySheet({
            id: entry.foodId, name: entry.name, brand: entry.brand, barcode: entry.barcode, source: entry.source,
            unit: entry.unit, gramsPerUnit: entry.gramsPerUnit,
            per100: entry.grams > 0 ? {
              calories: entry.calories / entry.grams * 100,
              protein: entry.protein / entry.grams * 100,
              carbs: entry.carbs / entry.grams * 100,
              fat: entry.fat / entry.grams * 100,
              fiber: entry.fiber / entry.grams * 100,
            } : {},
          }, date)}><b>{entry.name}</b><span>{fmtNum(entry.quantity)} {entry.unit === 'g' ? 'g' : t(entry.unit === 'slice' ? 'Slice' : entry.unit === 'piece' ? 'Piece' : 'Portion')} · P {fmtNum(entry.protein)} g</span></button>
          <b>{Math.round(entry.calories)} kcal</b>
          <button className="iconbtn food-delete" onClick={() => deleteNutritionEntry(entry.id)} aria-label={t('Delete')}><Icon name="xmark" /></button>
        </div>) : <button className="empty-meal" onClick={() => foodEntrySheet(null, date)}><Icon name="plus" />{t('Add food')}</button>}
      </div>
    })}
  </div>
}

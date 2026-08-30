import { useMemo, useState } from 'react'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { todayISO, uid } from './lib/format.js'
import { macrosFor, normalizeNutrition } from './lib/nutrition.js'
import { t } from './lib/i18n.js'
import { Button, NumberField, Segmented, TextField } from './components/ui.jsx'
import Icon from './components/Icon.jsx'

const ui = () => useUI.getState()
const update = mut => useStore.getState().update(state => {
  state.nutrition = normalizeNutrition(state.nutrition)
  mut(state.nutrition, state)
})
const toast = message => ui().toast(message)

const MEALS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

const UNITS = [
  { value: 'g', label: 'g' },
  { value: 'slice', label: 'Slice' },
  { value: 'piece', label: 'Piece' },
  { value: 'portion', label: 'Portion' },
]

const cleanPer100 = food => ({
  calories: Math.max(0, Number(food?.per100?.calories) || 0),
  protein: Math.max(0, Number(food?.per100?.protein) || 0),
  carbs: Math.max(0, Number(food?.per100?.carbs) || 0),
  fat: Math.max(0, Number(food?.per100?.fat) || 0),
  fiber: Math.max(0, Number(food?.per100?.fiber) || 0),
})

function FoodEntryForm({ food, date, close }) {
  const initialUnit = food?.unit || (food?.serving?.grams ? 'portion' : 'g')
  const [name, setName] = useState(food?.name || '')
  const [meal, setMeal] = useState('snack')
  const [unit, setUnit] = useState(initialUnit)
  const [quantity, setQuantity] = useState(1)
  const [gramsPerUnit, setGramsPerUnit] = useState(
    initialUnit === 'g' ? 1 : Number(food?.gramsPerUnit || food?.serving?.grams) || 100,
  )
  const [per100, setPer100] = useState(cleanPer100(food))
  const grams = unit === 'g' ? quantity : quantity * gramsPerUnit
  const totals = useMemo(() => macrosFor({ per100 }, grams), [per100, grams])

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return toast(t('Enter a food name'))
    if (!(grams > 0)) return toast(t('Enter a valid amount'))
    const foodId = food?.id || food?.barcode || `food-${uid()}`
    const entry = {
      id: uid(),
      date: date || todayISO(),
      meal,
      foodId,
      name: trimmed,
      brand: food?.brand || '',
      quantity,
      unit,
      gramsPerUnit: unit === 'g' ? 1 : gramsPerUnit,
      grams: Math.round(grams * 10) / 10,
      ...totals,
      barcode: food?.barcode || null,
      source: food?.source || 'manual',
      createdAt: Date.now(),
    }
    update(nutrition => {
      nutrition.entries.push(entry)
      const saved = {
        id: foodId,
        name: trimmed,
        brand: food?.brand || '',
        barcode: food?.barcode || null,
        source: food?.source || 'manual',
        per100,
        unit,
        gramsPerUnit: unit === 'g' ? 1 : gramsPerUnit,
        serving: food?.serving || null,
        lastUsed: Date.now(),
      }
      const index = nutrition.foods.findIndex(item => item.id === foodId || (saved.barcode && item.barcode === saved.barcode))
      if (index >= 0) nutrition.foods[index] = { ...nutrition.foods[index], ...saved }
      else nutrition.foods.push(saved)
    })
    close()
    toast(t('{0} logged', trimmed))
  }

  const MacroInput = ({ field, label, unitLabel = 'g' }) => (
    <label className="nutrition-field">
      <span>{label}</span>
      <span className="nutrition-input-unit">
        <NumberField value={per100[field]} onChange={value => setPer100(current => ({ ...current, [field]: value }))} />
        <i>{unitLabel}</i>
      </span>
    </label>
  )

  return <>
    <h3>{t(food ? 'Log food' : 'Create food')}</h3>
    {food?.brand && <div className="small muted" style={{ marginTop: -8, marginBottom: 12 }}>{food.brand}</div>}
    <label className="nutrition-field"><span>{t('Food')}</span><TextField value={name} onChange={event => setName(event.target.value)} placeholder={t('e.g. wholegrain toast')} /></label>
    <div className="nutrition-field"><span>{t('Meal')}</span><Segmented value={meal} onChange={setMeal} options={MEALS.map(item => ({ ...item, label: t(item.label) }))} /></div>
    <div className="nutrition-field"><span>{t('Unit')}</span><Segmented value={unit} onChange={setUnit} options={UNITS.map(item => ({ ...item, label: t(item.label) }))} /></div>
    <div className="nutrition-form-grid">
      <label className="nutrition-field"><span>{t('Amount')}</span><NumberField value={quantity} onChange={setQuantity} /></label>
      {unit !== 'g' && <label className="nutrition-field"><span>{t('Grams per {0}', t(UNITS.find(item => item.value === unit)?.label || unit).toLowerCase())}</span><NumberField value={gramsPerUnit} onChange={setGramsPerUnit} /></label>}
    </div>
    <div className="small muted" style={{ margin: '2px 0 12px' }}>{t('Nutrition values per 100 g')}</div>
    <div className="nutrition-form-grid macros">
      <MacroInput field="calories" label={t('Calories')} unitLabel="kcal" />
      <MacroInput field="protein" label={t('Protein')} />
      <MacroInput field="carbs" label={t('Carbs')} />
      <MacroInput field="fat" label={t('Fat')} />
      <MacroInput field="fiber" label={t('Fiber')} />
    </div>
    <div className="nutrition-preview">
      <div><b>{Math.round(grams)} g</b><span>{quantity} × {unit === 'g' ? 'g' : t(UNITS.find(item => item.value === unit)?.label || unit)}</span></div>
      <div><b>{totals.calories} kcal</b><span>P {totals.protein} · C {totals.carbs} · F {totals.fat}</span></div>
    </div>
    <Button variant="primary" icon="plus" onClick={save}>{t('Add to diary')}</Button>
  </>
}

export function foodEntrySheet(food = null, date = todayISO()) {
  return ui().openSheet(close => <FoodEntryForm food={food} date={date} close={close} />)
}

function GoalForm({ close }) {
  const current = normalizeNutrition(useStore.getState().S.nutrition).goals
  const [goals, setGoals] = useState({ ...current })
  const set = (key, value) => setGoals(valueNow => ({ ...valueNow, [key]: value || null }))
  const save = () => {
    update(nutrition => { nutrition.goals = { ...nutrition.goals, ...goals } })
    close()
    toast(t('Nutrition goals saved'))
  }
  const Field = ({ k, label, unit }) => <label className="nutrition-field"><span>{label}</span><span className="nutrition-input-unit"><NumberField nullable value={goals[k]} onChange={value => set(k, value)} /><i>{unit}</i></span></label>
  return <>
    <h3>{t('Nutrition goals')}</h3>
    <div className="nutrition-field"><span>{t('Goal')}</span><Segmented value={goals.mode} onChange={value => setGoals(currentGoals => ({ ...currentGoals, mode: value }))} options={[
      { value: 'lose', label: t('Lose') }, { value: 'maintain', label: t('Maintain') }, { value: 'gain', label: t('Gain') },
    ]} /></div>
    <div className="nutrition-form-grid macros">
      <Field k="calories" label={t('Calories')} unit="kcal" />
      <Field k="protein" label={t('Protein')} unit="g" />
      <Field k="carbs" label={t('Carbs')} unit="g" />
      <Field k="fat" label={t('Fat')} unit="g" />
      <Field k="fiber" label={t('Fiber')} unit="g" />
      <Field k="waterMl" label={t('Water')} unit="ml" />
      {goals.mode !== 'maintain' && <Field k="rateKgWeek" label={t('Target pace')} unit="kg/week" />}
    </div>
    <p className="small muted">{t('These are personal tracking targets, not a medical diagnosis. The coach only proposes changes and never applies them automatically.')}</p>
    <Button variant="primary" icon="check" onClick={save}>{t('Save goals')}</Button>
  </>
}

export const nutritionGoalSheet = () => ui().openSheet(close => <GoalForm close={close} />)

export function addWater(ml, date = todayISO()) {
  update(nutrition => { nutrition.water.push({ id: uid(), date, ml: Math.max(0, Math.round(ml)), createdAt: Date.now() }) })
  toast(t('{0} ml water logged', ml))
}

export function deleteNutritionEntry(id) {
  update(nutrition => { nutrition.entries = nutrition.entries.filter(entry => entry.id !== id) })
}


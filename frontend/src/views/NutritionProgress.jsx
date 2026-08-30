import { useStore } from '../store/useStore.js'
import { coachSnapshot, daySeries, nutritionOf, weightTrend } from '../lib/nutrition.js'
import { dateLocale, t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import Icon from '../components/Icon.jsx'

export default function NutritionProgress() {
  const S = useStore(state => state.S)
  const nutrition = nutritionOf(S)
  const rows = daySeries(S, 14)
  const snapshot = coachSnapshot(S)
  const weight = weightTrend(S.bodyweight, 28)
  const maxCalories = Math.max(nutrition.goals.calories || 0, ...rows.map(row => row.calories), 1)

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

    <div className="card info-card"><Icon name="info" /><p>{t('Water intake is tracked separately from possible water retention. Short-term scale changes are treated as noise until the trend has enough data.')}</p></div>
  </div>
}


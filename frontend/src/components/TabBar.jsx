import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine } from '../lib/history.js'
import { todayISO } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'
import { foodEntrySheet } from '../nutritionSheets.jsx'

export default function TabBar({ onStart }) {
  const nav = useNavigate()
  const loc = useLocation()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const isGuest = useStore(s => s.isGuest())
  if ((!user && !isGuest) || loc.pathname === '/onboarding') return null
  const cur = loc.pathname.split('/')[1] || 'home'
  const nutritionMode = loc.pathname.startsWith('/nutrition')
  const on = k => cur === k || (cur === 'history' && k === 'stats') || (cur === 'settings' && k === 'home')

  const startWorkout = () => {
    if (!S.active) {
      const r = effectiveRoutine(S, todayISO())
      if (r && r.ex.length) { onStart(r.id); return }
    }
    nav('/workout')
  }
  const Tab = ({ k, icon, to, label }) => (
    <button className={on(k) ? 'on' : ''} onClick={() => nav(to)}>
      <Icon name={icon} /><span>{label}</span>
    </button>
  )

  if (nutritionMode) {
    const NutritionTab = ({ to, icon, label, exact }) => {
      const selected = exact ? loc.pathname === to : loc.pathname.startsWith(to)
      return <button className={selected ? 'on' : ''} onClick={() => nav(to)}><Icon name={icon} /><span>{label}</span></button>
    }
    return <nav id="tabbar" className="nutrition-tabbar">
      <NutritionTab exact to="/nutrition" icon="house" label={t('Today')} />
      <NutritionTab to="/nutrition/foods" icon="food" label={t('Food')} />
      <button className="start" onClick={() => foodEntrySheet()}>
        <span className="cir"><Icon name="plus" /></span><span>{t('Log')}</span>
      </button>
      <NutritionTab to="/nutrition/progress" icon="chartLine" label={t('Progress')} />
      <NutritionTab to="/nutrition/coach" icon="sparkles" label={t('Coach')} />
    </nav>
  }

  return (
    <nav id="tabbar">
      <Tab k="home" icon="house" to="/home" label={t('Home')} />
      <Tab k="plan" icon="calendar" to="/plan" label={t('Plan')} />
      <button className={'start' + (S.active ? ' rec' : '')} onClick={startWorkout}>
        <span className="cir"><Icon name={S.active ? 'play' : 'dumbbell'} /></span>
        <span>{S.active ? t('Resume') : t('Start')}</span>
      </button>
      <Tab k="stats" icon="chart" to="/stats" label={t('Stats')} />
      <Tab k="library" icon="list" to="/library" label={t('Exercises')} />
    </nav>
  )
}

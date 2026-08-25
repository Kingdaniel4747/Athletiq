import { useLocation, useNavigate } from 'react-router-dom'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

export default function ModeSwitch() {
  const nav = useNavigate()
  const loc = useLocation()
  const nutrition = loc.pathname.startsWith('/nutrition') || loc.pathname.startsWith('/coach')
  return <div className="mode-switch-wrap">
    <div className="mode-switch" role="group" aria-label={t('App mode')}>
      <span className="mode-switch-thumb" style={{ transform: `translateX(${nutrition ? '100%' : '0'})` }} />
      <button className={!nutrition ? 'on' : ''} onClick={() => nav('/home')}><Icon name="dumbbell" /><span>{t('Training')}</span></button>
      <button className={nutrition ? 'on' : ''} onClick={() => nav('/nutrition')}><Icon name="food" /><span>{t('Nutrition')}</span></button>
    </div>
  </div>
}


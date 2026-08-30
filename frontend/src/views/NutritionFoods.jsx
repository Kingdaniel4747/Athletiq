import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { getMealieRecipe, lookupProduct, searchMealie } from '../lib/nutritionApi.js'
import { nutritionOf } from '../lib/nutrition.js'
import { t } from '../lib/i18n.js'
import { foodEntrySheet } from '../nutritionSheets.jsx'
import { Button, SearchField, TextField } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

function Scanner({ onCode, onClose }) {
  const video = useRef(null)
  const [message, setMessage] = useState(t('Starting camera…'))
  useEffect(() => {
    let stream = null
    let timer = null
    let stopped = false
    const start = async () => {
      if (!('BarcodeDetector' in window)) {
        setMessage(t('Camera barcode recognition is not available in this browser. Enter the number below.'))
        return
      }
      try {
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        video.current.srcObject = stream
        await video.current.play()
        setMessage(t('Hold the barcode inside the frame.'))
        const scan = async () => {
          if (stopped) return
          try {
            const codes = await detector.detect(video.current)
            if (codes[0]?.rawValue) { stopped = true; onCode(codes[0].rawValue); return }
          } catch { /* keep scanning */ }
          timer = window.setTimeout(scan, 350)
        }
        scan()
      } catch (error) {
        setMessage(error?.name === 'NotAllowedError' ? t('Camera permission was denied.') : t('The camera could not be opened.'))
      }
    }
    start()
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      stream?.getTracks().forEach(track => track.stop())
    }
  }, [onCode])
  return <div className="scanner card">
    <button className="iconbtn scanner-close" onClick={onClose}><Icon name="xmark" /></button>
    <video ref={video} muted playsInline />
    <span className="scanner-frame" />
    <div className="small">{message}</div>
  </div>
}

export default function NutritionFoods() {
  const loc = useLocation()
  const S = useStore(state => state.S)
  const config = useStore(state => state.config)
  const loadConfig = useStore(state => state.loadConfig)
  const toast = useUI(state => state.toast)
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')
  const [scanning, setScanning] = useState(new URLSearchParams(loc.search).has('scan'))
  const [busy, setBusy] = useState(false)
  const [mealieRows, setMealieRows] = useState([])
  const [mealieBusy, setMealieBusy] = useState(false)
  const mealieRequested = new URLSearchParams(loc.search).has('mealie')
  useEffect(() => { loadConfig() }, [loadConfig])

  const foods = useMemo(() => nutritionOf(S).foods
    .filter(food => !query || `${food.name} ${food.brand || ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)), [S, query])

  const findProduct = async code => {
    setBusy(true)
    setScanning(false)
    try {
      const result = await lookupProduct(code)
      if (!result.found) toast(t('Product not found — create it manually.'))
      foodEntrySheet(result.found ? result.food : { barcode: code, source: 'manual' })
    } catch (error) { toast(error.message || t('Product lookup failed')) }
    finally { setBusy(false) }
  }

  const findMealie = async () => {
    setMealieBusy(true)
    try {
      const result = await searchMealie(query)
      setMealieRows(result.recipes || [])
      if (!(result.recipes || []).length) toast(t('No Mealie recipes found.'))
    } catch (error) { toast(error.message || t('Mealie is not available.')) }
    finally { setMealieBusy(false) }
  }

  const openRecipe = async recipe => {
    setMealieBusy(true)
    try {
      const result = await getMealieRecipe(recipe.slug)
      foodEntrySheet(result.food)
    } catch (error) { toast(error.message || t('Recipe could not be loaded.')) }
    finally { setMealieBusy(false) }
  }

  useEffect(() => { if (mealieRequested && config?.mealie_enabled) findMealie() }, [mealieRequested, config?.mealie_enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="narrow nutrition-page">
    <div className="hdr"><div><h1>{t('Food')}</h1><div className="sub">{t('Scan, search or use a Mealie recipe')}</div></div><button className="iconbtn" onClick={() => foodEntrySheet()}><Icon name="plus" /></button></div>

    {scanning && <Scanner onCode={code => { setBarcode(code); findProduct(code) }} onClose={() => setScanning(false)} />}

    <div className="card barcode-card">
      <div className="row between"><div><h2>{t('Barcode')}</h2><div className="small muted">EAN / UPC</div></div><Button size="sm" variant="tinted" icon="scan" onClick={() => setScanning(true)}>{t('Open camera')}</Button></div>
      <div className="barcode-input"><TextField inputMode="numeric" value={barcode} onChange={event => setBarcode(event.target.value.replace(/[^0-9]/g, ''))} placeholder="4001234567890" /><Button variant="primary" disabled={busy || barcode.length < 8} onClick={() => findProduct(barcode)}>{busy ? t('Loading…') : t('Find')}</Button></div>
    </div>

    <div className="card">
      <div className="row between"><div><h2>Mealie</h2><div className="small muted">{config?.mealie_enabled ? t('Connected through your AthletiQ server') : t('Add MEALIE_URL and MEALIE_API_TOKEN to .env')}</div></div><span className={`status-dot ${config?.mealie_enabled ? 'green' : 'yellow'}`} /></div>
      <div className="row" style={{ marginTop: 12 }}><SearchField value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery('')} placeholder={t('Search recipes')} /><Button size="sm" disabled={!config?.mealie_enabled || mealieBusy} onClick={findMealie}>{t('Search')}</Button></div>
      {!!mealieRows.length && <div className="food-library mealie-list">{mealieRows.map(recipe => <button key={recipe.slug} onClick={() => openRecipe(recipe)}><span className="food-dot mealie"><Icon name="book" /></span><span><b>{recipe.name}</b><small>{recipe.recipeYield || t('Choose portion when logging')}</small></span><Icon name="chevronRight" /></button>)}</div>}
    </div>

    <div className="row between diary-heading"><h2>{t('Saved foods')}</h2><span className="small muted">{foods.length}</span></div>
    <SearchField value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery('')} placeholder={t('Search saved foods')} />
    <div className="card food-library">
      {foods.length ? foods.map(food => <button key={food.id} onClick={() => foodEntrySheet(food)}><span className="food-dot"><Icon name="food" /></span><span><b>{food.name}</b><small>{food.brand || `${food.per100?.calories || 0} kcal / 100 g`}</small></span><Icon name="plus" /></button>) : <div className="empty-state"><Icon name="food" /><b>{t('No saved foods yet')}</b><span>{t('Scan a product or create one manually.')}</span></div>}
    </div>
  </div>
}


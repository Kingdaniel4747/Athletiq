import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { t } from '../lib/i18n.js'
import { downloadExerciseMedia, hasDownloadedExerciseMedia } from '../lib/offline-media.js'

const DISMISSED = 'athletiq-media-prompt-dismissed'

export default function MediaDownloadPrompt({ hidden = false }) {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 })

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED)) return
    let active = true
    hasDownloadedExerciseMedia()
      .then(done => { if (active && !done) setVisible(true) })
      .catch(() => { if (active) setVisible(true) })
    return () => { active = false }
  }, [])

  async function download() {
    setStatus('downloading')
    setProgress({ done: 0, total: 0, failed: 0 })
    try {
      await downloadExerciseMedia(setProgress)
      setStatus('done')
    } catch (error) {
      setStatus(error.message === 'secure-context-required' ? 'https' : 'error')
      if (error.failed) setProgress(p => ({ ...p, failed: error.failed }))
    }
  }

  function dismiss() {
    if (status !== 'done') sessionStorage.setItem(DISMISSED, '1')
    setVisible(false)
  }

  if (!visible || hidden) return null
  const pct = progress.total ? Math.round(progress.done / progress.total * 100) : 0
  const working = status === 'downloading'

  return (
    <section className="media-download" aria-live="polite">
      <div className="media-download-icon"><Icon name={status === 'done' ? 'checkCircle' : 'download'} /></div>
      <div className="media-download-copy">
        <strong>{status === 'done' ? t('Exercise media ready') : t('Download exercise media')}</strong>
        <p>{status === 'done'
          ? t('Images and animations are now stored in this browser.')
          : t('Download all exercise images and animations once for faster and offline use. About 140 MB will be stored in this browser, not on your server.')}</p>

        {working && (
          <div className="media-download-progress">
            <progress value={progress.done} max={progress.total || 1} />
            <span>{t('{0}% · {1} of {2} files', pct, progress.done, progress.total || '…')}</span>
          </div>
        )}
        {status === 'error' && <p className="media-download-error">{t('{0} files could not be downloaded. Tap retry to continue.', progress.failed)}</p>}
        {status === 'https' && <p className="media-download-error">{t('Offline storage requires HTTPS (or localhost). Online exercise media still works.')}</p>}

        <div className="media-download-actions">
          {status !== 'done' && status !== 'https' && (
            <button className="media-download-primary" type="button" onClick={download} disabled={working}>
              {working ? t('Downloading…') : status === 'error' ? t('Retry') : t('Download all')}
            </button>
          )}
          {!working && <button type="button" onClick={dismiss}>{status === 'done' ? t('Done') : t('Later')}</button>}
        </div>
      </div>
    </section>
  )
}

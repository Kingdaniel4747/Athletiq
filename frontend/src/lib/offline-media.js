import { EXDB, imgSrc, gifSrc } from './exercises.js'

export const MEDIA_CACHE = 'athletiq-media-v1'
const MARKER_PATH = '/__athletiq_exercise_media_v1__'
const CONCURRENCY = 4

export const exerciseMediaUrls = () => [...new Set(EXDB.flatMap(ex => [
  ex.img ? imgSrc(ex) : null,
  ex.gif ? gifSrc(ex) : null,
].filter(Boolean)))]

const markerUrl = () => new URL(MARKER_PATH, window.location.origin).href

export async function hasDownloadedExerciseMedia() {
  if (!('caches' in window)) return false
  const cache = await caches.open(MEDIA_CACHE)
  return !!(await cache.match(markerUrl()))
}

export async function downloadExerciseMedia(onProgress = () => {}) {
  if (!window.isSecureContext || !('caches' in window)) {
    throw new Error('secure-context-required')
  }

  // Ask the browser not to evict a deliberately downloaded offline library. Browsers may
  // decline the request; caching still works and the completion marker will disappear if the
  // browser later evicts it, causing the prompt to be shown again.
  await navigator.storage?.persist?.().catch(() => false)

  const urls = exerciseMediaUrls()
  const cache = await caches.open(MEDIA_CACHE)
  let cursor = 0
  let done = 0
  const failed = []
  onProgress({ done, total: urls.length })

  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++]
      try {
        if (!(await cache.match(url))) {
          const response = await fetch(url, { cache: 'no-cache' })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          await cache.put(url, response)
        }
      } catch (error) {
        failed.push({ url, error })
      }
      done++
      onProgress({ done, total: urls.length, failed: failed.length })
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker))
  if (failed.length) {
    const error = new Error('media-download-failed')
    error.failed = failed.length
    error.total = urls.length
    throw error
  }

  await cache.put(markerUrl(), new Response(JSON.stringify({ completed: Date.now(), files: urls.length }), {
    headers: { 'Content-Type': 'application/json' },
  }))
  return { total: urls.length }
}

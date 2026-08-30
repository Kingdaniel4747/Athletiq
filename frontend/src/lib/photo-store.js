const DB_NAME = 'athletiq-private-media'
const STORE = 'progress-photos'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transaction(mode, run) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    let value
    try { value = run(store) } catch (error) { reject(error); return }
    tx.oncomplete = () => { db.close(); resolve(value) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  }))
}

export async function saveProgressPhoto(file, owner = 'guest') {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose an image file')
  if (file.size > 8 * 1024 * 1024) throw new Error('Image is larger than 8 MB')
  const id = window.crypto?.randomUUID?.() || `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const row = { id, owner, date: new Date().toISOString().slice(0, 10), createdAt: Date.now(), type: file.type, blob: file }
  await transaction('readwrite', store => store.put(row))
  return row
}

export async function listProgressPhotos(owner = 'guest') {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll()
    request.onsuccess = () => { db.close(); resolve(request.result.filter(row => row.owner === owner).sort((a, b) => b.createdAt - a.createdAt)) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export const deleteProgressPhoto = id => transaction('readwrite', store => store.delete(id))

export async function deleteProgressPhotos(owner = 'guest') {
  const rows = await listProgressPhotos(owner)
  await Promise.all(rows.map(row => deleteProgressPhoto(row.id)))
}

export async function moveProgressPhotos(fromOwner, toOwner) {
  if (!fromOwner || !toOwner || fromOwner === toOwner) return
  const rows = await listProgressPhotos(fromOwner)
  await Promise.all(rows.map(row => transaction('readwrite', store => store.put({ ...row, owner: toOwner }))))
}

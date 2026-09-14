import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { collection, onSnapshot, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'

// Student favorites, stored per-user at users/{uid}/favorites/{type_contentId}.
// Deterministic doc ids make toggling idempotent. Live-synced so the heart state
// is instant everywhere. Owner-only by security rules.

const FavoritesContext = createContext(null)
const keyOf = (type, contentId) => `${type}:${contentId}`
const docIdOf = (type, contentId) => `${type}_${String(contentId).replace(/[^A-Za-z0-9_-]/g, '')}`

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setFavorites([]); setLoading(false); return }
    setLoading(true)
    const col = collection(db, 'users', user.uid, 'favorites')
    const unsub = onSnapshot(
      col,
      (snap) => { setFavorites(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false) },
      () => setLoading(false)
    )
    return unsub
  }, [user])

  const favSet = useMemo(() => new Set(favorites.map((f) => keyOf(f.type, f.contentId))), [favorites])
  const isFavorite = useCallback((type, contentId) => favSet.has(keyOf(type, contentId)), [favSet])

  // item: { type, contentId, title?, subjectId?, unitId?, stream? }
  const toggleFavorite = useCallback(async (item) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'favorites', docIdOf(item.type, item.contentId))
    if (isFavorite(item.type, item.contentId)) {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, {
        type: item.type,
        contentId: item.contentId,
        title: item.title || '',
        subjectId: item.subjectId || '',
        unitId: item.unitId || '',
        stream: item.stream || '',
        createdAt: serverTimestamp()
      })
    }
  }, [user, isFavorite])

  const value = { favorites, loading, isFavorite, toggleFavorite, count: favorites.length }
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within <FavoritesProvider>')
  return ctx
}

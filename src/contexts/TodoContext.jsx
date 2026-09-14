import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'

// Global To-Do state. For authenticated students, tasks live in Firestore under
// users/{uid}/tasks (so they follow the student across devices, sessions and
// reloads, and are isolated per student by security rules). For the rare guest
// case, a localStorage fallback keeps the feature usable. Legacy localStorage
// todos are migrated into Firestore once, on first sign-in.

const GUEST_KEY = 'ezbac_todos_guest'
const LEGACY_KEY = 'ezbac_todos' // written by the old page-local implementations
const TodoContext = createContext(null)

export function TodoProvider({ children }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const migratedRef = useRef(false)

  const tasksCol = useCallback(() => collection(db, 'users', user.uid, 'tasks'), [user])

  useEffect(() => {
    migratedRef.current = false
    if (!user) {
      try { setTasks(JSON.parse(localStorage.getItem(GUEST_KEY) || '[]')) } catch { setTasks([]) }
      setLoading(false)
      return
    }
    setLoading(true)
    const col = collection(db, 'users', user.uid, 'tasks')
    const q = query(col, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      async (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError('')
        // One-time migration of legacy localStorage todos into Firestore.
        if (!migratedRef.current && snap.empty) {
          migratedRef.current = true
          try {
            const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]')
            if (Array.isArray(legacy) && legacy.length) {
              const batch = writeBatch(db)
              legacy.forEach((t) => batch.set(doc(col), {
                text: t.text || '',
                completed: !!t.completed,
                createdAt: serverTimestamp(),
                completedAt: t.completed ? serverTimestamp() : null
              }))
              await batch.commit()
              localStorage.removeItem(LEGACY_KEY)
            }
          } catch { /* migration is best-effort */ }
        }
      },
      (err) => { setError(err.message); setLoading(false) }
    )
    return unsub
  }, [user])

  // Persist guest tasks locally.
  useEffect(() => {
    if (user) return
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(tasks)) } catch { /* ignore */ }
  }, [tasks, user])

  const addTask = useCallback(async (text) => {
    const t = (text || '').trim()
    if (!t) return
    setError('')
    try {
      if (user) {
        await addDoc(tasksCol(), { text: t, completed: false, createdAt: serverTimestamp(), completedAt: null })
      } else {
        setTasks((prev) => [{ id: `local_${Date.now()}`, text: t, completed: false, createdAt: Date.now(), completedAt: null }, ...prev])
      }
    } catch (e) { setError(e.message) }
  }, [user, tasksCol])

  const toggleTask = useCallback(async (task) => {
    const completed = !task.completed
    setError('')
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), {
          completed, completedAt: completed ? serverTimestamp() : null
        })
      } else {
        setTasks((prev) => prev.map((x) => x.id === task.id ? { ...x, completed, completedAt: completed ? Date.now() : null } : x))
      }
    } catch (e) { setError(e.message) }
  }, [user])

  const editTask = useCallback(async (task, text) => {
    const t = (text || '').trim()
    if (!t) return
    setError('')
    try {
      if (user) await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), { text: t })
      else setTasks((prev) => prev.map((x) => x.id === task.id ? { ...x, text: t } : x))
    } catch (e) { setError(e.message) }
  }, [user])

  const deleteTask = useCallback(async (task) => {
    setError('')
    try {
      if (user) await deleteDoc(doc(db, 'users', user.uid, 'tasks', task.id))
      else setTasks((prev) => prev.filter((x) => x.id !== task.id))
    } catch (e) { setError(e.message) }
  }, [user])

  const { pending, completed } = useMemo(() => ({
    pending: tasks.filter((t) => !t.completed),
    completed: tasks.filter((t) => t.completed)
  }), [tasks])

  const value = {
    tasks, pending, completed, loading, error,
    total: tasks.length,
    completedCount: completed.length,
    addTask, toggleTask, editTask, deleteTask
  }

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>
}

export function useTodos() {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error('useTodos must be used within <TodoProvider>')
  return ctx
}

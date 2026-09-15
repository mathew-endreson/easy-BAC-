import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase.js'
import { isValidStream } from '../constants/streams.js'
import { isValidWilaya } from '../constants/wilayas.js'

const AuthContext = createContext(null)

// Maps Firebase auth/firestore error codes to i18n keys (see LangContext).
export function authErrorKey(err) {
  const code = err?.code || ''
  switch (code) {
    case 'auth/invalid-email': return 'err-invalid-email'
    case 'auth/weak-password': return 'err-weak-password'
    case 'auth/email-already-in-use': return 'err-email-in-use'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found': return 'err-wrong-credentials'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request': return 'err-popup-closed'
    case 'auth/network-request-failed': return 'err-network'
    case 'permission-denied': return 'err-permission'
    default: return 'err-generic'
  }
}

// A profile is "complete" only once the student has both a wilaya and a valid
// BAC stream. Super admins are always considered complete.
export function isProfileComplete(profile) {
  if (!profile) return false
  if (profile.role === 'super_admin') return true
  return Boolean(profile.profileCompleted && profile.wilaya && isValidStream(profile.bacStream))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Firebase auth user
  const [profile, setProfile] = useState(null) // Firestore users/{uid} doc
  const [loading, setLoading] = useState(true) // true until first auth resolution

  // Load the Firestore profile for a signed-in user, creating a default
  // student profile on first sign-in (covers Google first-timers). Never sets a
  // privileged role from the client — security rules also enforce this.
  const loadProfile = useCallback(async (fbUser) => {
    const ref = doc(db, 'users', fbUser.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() }
    }
    const initial = {
      displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Student'),
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || '',
      wilaya: '',
      bacStream: '',
      role: 'student',
      profileCompleted: false,
      disabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    await setDoc(ref, initial)
    const created = await getDoc(ref)
    return { id: created.id, ...created.data() }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setUser(fbUser)
      try {
        const p = await loadProfile(fbUser)
        setProfile(p)
        // One write per sign-in (not per render/tick) so the Super Admin
        // dashboard can show real "last active" data without excessive writes.
        updateDoc(doc(db, 'users', fbUser.uid), { lastLoginAt: serverTimestamp() }).catch(() => {})
      } catch (e) {
        console.error('Profile load failed:', e)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return null
    const p = await loadProfile(auth.currentUser)
    setProfile(p)
    return p
  }, [loadProfile])

  // ── Auth actions ──────────────────────────────────────────────────
  const loginWithEmail = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    return cred.user
  }, [])

  const registerWithEmail = useCallback(async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    if (name) {
      try { await updateAuthProfile(cred.user, { displayName: name.trim() }) } catch { /* non-fatal */ }
    }
    // Create the profile doc immediately with the chosen name.
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: name?.trim() || email.split('@')[0],
      email: email.trim(),
      photoURL: '',
      wilaya: '',
      bacStream: '',
      role: 'student',
      profileCompleted: false,
      disabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true })
    await refreshProfile()
    return cred.user
  }, [refreshProfile])

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider)
    return cred.user
  }, [])

  const logout = useCallback(() => signOut(auth), [])

  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email.trim()), [])

  // Complete or update the mutable parts of a profile. Deliberately whitelists
  // fields — role and email are never writable here (and rules block them too).
  const completeProfile = useCallback(async ({ wilaya, bacStream, displayName }) => {
    if (!auth.currentUser) throw new Error('not-authenticated')
    if (!isValidWilaya(wilaya) || !isValidStream(bacStream)) {
      const e = new Error('invalid-profile'); e.code = 'err-required-fields'; throw e
    }
    const patch = {
      wilaya,
      bacStream,
      profileCompleted: true,
      updatedAt: serverTimestamp()
    }
    if (displayName) patch.displayName = displayName.trim()
    await updateDoc(doc(db, 'users', auth.currentUser.uid), patch)
    return refreshProfile()
  }, [refreshProfile])

  const updateProfileFields = useCallback(async (fields) => {
    if (!auth.currentUser) throw new Error('not-authenticated')
    const allowed = {}
    for (const k of ['displayName', 'photoURL', 'wilaya', 'bacStream']) {
      if (fields[k] !== undefined) allowed[k] = fields[k]
    }
    allowed.updatedAt = serverTimestamp()
    await updateDoc(doc(db, 'users', auth.currentUser.uid), allowed)
    return refreshProfile()
  }, [refreshProfile])

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    role: profile?.role || (user ? 'student' : null),
    isSuperAdmin: profile?.role === 'super_admin',
    profileComplete: isProfileComplete(profile),
    stream: profile?.bacStream || null,
    isDisabled: profile?.disabled === true,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
    completeProfile,
    updateProfileFields,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

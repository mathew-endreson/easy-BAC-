import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Firebase web config. The web apiKey is NOT a secret (it only identifies the
// project — access is governed by Firestore/Storage Security Rules), so shipping
// it to the client is expected. We still read it from Vite env vars when present
// (set them in Vercel for prod) and fall back to the known project values so
// local dev works with zero setup. See .env.example.
const env = import.meta.env
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDbPqA_j34xT1DI_dPl6SR36j8tVSb_MWk',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'ezbac-fcd49.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'ezbac-fcd49',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'ezbac-fcd49.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '302236446267',
  appId: env.VITE_FIREBASE_APP_ID || '1:302236446267:web:cd0776fc8c1d5eb14ab61e',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-TVLTSY8P1E'
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Google sign-in provider. `prompt: 'select_account'` avoids silently reusing a
// stale Google session and lets the student pick which account to use.
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export default app

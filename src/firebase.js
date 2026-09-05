import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyDbPqA_j34xT1DI_dPl6SR36j8tVSb_MWk',
  authDomain: 'ezbac-fcd49.firebaseapp.com',
  projectId: 'ezbac-fcd49',
  storageBucket: 'ezbac-fcd49.firebasestorage.app',
  messagingSenderId: '302236446267',
  appId: '1:302236446267:web:cd0776fc8c1d5eb14ab61e',
  measurementId: 'G-TVLTSY8P1E'
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)

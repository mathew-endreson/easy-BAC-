// c:\Users\surface laptop\Desktop\EzBac-main\firebase.js

// Using Firebase Modular SDK via CDN (Standard for static HTML projects)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbPqA_j34xT1DI_dPl6SR36j8tVSb_MWk",
  authDomain: "ezbac-fcd49.firebaseapp.com",
  projectId: "ezbac-fcd49",
  storageBucket: "ezbac-fcd49.firebasestorage.app",
  messagingSenderId: "302236446267",
  appId: "1:302236446267:web:cd0776fc8c1d5eb14ab61e",
  measurementId: "G-TVLTSY8P1E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export for use in other files
export { db };

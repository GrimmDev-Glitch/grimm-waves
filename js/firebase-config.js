// ─────────────────────────────────────────────────────────────
// Reemplazá estos valores por los de TU proyecto de Firebase.
// Los sacás en: Firebase Console → ⚙ Configuración del proyecto
// → pestaña "General" → sección "Tus apps" → app web (</>) → SDK setup.
//
// Es normal y seguro que estos valores queden públicos en el repo:
// no son contraseñas, son identificadores del proyecto. La seguridad
// real la ponen las reglas de Firestore (ver firestore.rules) y el
// login de Firebase Auth, no el hecho de que esto sea "secreto".
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyA_0oJYQHbInyBz-MFmnaguysmiUsZvMzo",
  authDomain: "grimm-waves.firebaseapp.com",
  projectId: "grimm-waves",
  storageBucket: "grimm-waves.firebasestorage.app",
  messagingSenderId: "900481603887",
  appId: "1:900481603887:web:bfaf1ae1e26d9f17a1e9da"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

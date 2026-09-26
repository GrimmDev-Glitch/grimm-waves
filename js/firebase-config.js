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
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

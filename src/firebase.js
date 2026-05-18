import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAILNnGyw3dJkN4IidT-vqdaACjFtusOKk",
  authDomain: "studio-lc-pilates.firebaseapp.com",
  projectId: "studio-lc-pilates",
  storageBucket: "studio-lc-pilates.firebasestorage.app",
  messagingSenderId: "658046186250",
  appId: "1:658046186250:web:9b20b2c81f94c71fb980f3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function cargarTodo() {
  try {
    const snap = await getDoc(doc(db, "datos", "principal"));
    return snap.exists() ? snap.data() : {};
  } catch { return {}; }
}

export async function guardarAlumnos(alumnos) {
  try { await setDoc(doc(db, "datos", "principal"), { alumnos }, { merge: true }); } catch {}
}

export async function guardarHorarios(horarios) {
  try { await setDoc(doc(db, "datos", "principal"), { horarios }, { merge: true }); } catch {}
}

export async function guardarPagos(pagos) {
  try { await setDoc(doc(db, "datos", "principal"), { pagos }, { merge: true }); } catch {}
}

export async function guardarHistorial(historial) {
  try { await setDoc(doc(db, "datos", "principal"), { historial }, { merge: true }); } catch {}
}

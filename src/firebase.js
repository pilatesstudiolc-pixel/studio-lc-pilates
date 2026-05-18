// src/firebase.js
// ─────────────────────────────────────────────────────────────
// PASO 1: Creá tu proyecto en https://console.firebase.google.com
//   → "Agregar proyecto" → nombre: "studio-lc-pilates"
//   → Desactivá Google Analytics (opcional) → Crear proyecto
//
// PASO 2: Agregá una app web
//   → Ícono </> "Web" → nombre: "Studio LC Pilates"
//   → Copiá la configuración que te da y pegala abajo
//
// PASO 3: Activá Firestore Database
//   → Build → Firestore Database → Crear base de datos
//   → Elegí "Iniciar en modo de prueba" → siguiente → listo
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

// ⚠️  REEMPLAZÁ estos valores con los de TU proyecto Firebase
const firebaseConfig = {
  apiKey:            "PEGAR_TU_API_KEY_AQUI",
  authDomain:        "PEGAR_TU_AUTH_DOMAIN_AQUI",
  projectId:         "PEGAR_TU_PROJECT_ID_AQUI",
  storageBucket:     "PEGAR_TU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "PEGAR_TU_MESSAGING_SENDER_ID_AQUI",
  appId:             "PEGAR_TU_APP_ID_AQUI"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ─── Helpers de persistencia ───────────────────────────────────

const DOC_ALUMNOS  = "datos/alumnos";
const DOC_HORARIOS = "datos/horarios";
const DOC_PAGOS    = "datos/pagos";
const DOC_HISTORIAL= "datos/historial";

export async function guardarAlumnos(alumnos) {
  await setDoc(doc(db, DOC_ALUMNOS), { lista: alumnos });
}

export async function guardarHorarios(horarios) {
  await setDoc(doc(db, DOC_HORARIOS), { data: JSON.stringify(horarios) });
}

export async function guardarPagos(pagos) {
  await setDoc(doc(db, DOC_PAGOS), { lista: pagos });
}

export async function guardarHistorial(historial) {
  await setDoc(doc(db, DOC_HISTORIAL), { lista: historial });
}

export async function cargarTodo() {
  try {
    const [snapAlumnos, snapHorarios, snapPagos, snapHistorial] = await Promise.all([
      getDoc(doc(db, DOC_ALUMNOS)),
      getDoc(doc(db, DOC_HORARIOS)),
      getDoc(doc(db, DOC_PAGOS)),
      getDoc(doc(db, DOC_HISTORIAL)),
    ]);
    return {
      alumnos:   snapAlumnos.exists()   ? snapAlumnos.data().lista       : null,
      horarios:  snapHorarios.exists()  ? JSON.parse(snapHorarios.data().data) : null,
      pagos:     snapPagos.exists()     ? snapPagos.data().lista          : null,
      historial: snapHistorial.exists() ? snapHistorial.data().lista      : null,
    };
  } catch (e) {
    console.warn("Firebase no disponible, usando datos locales:", e.message);
    return { alumnos: null, horarios: null, pagos: null, historial: null };
  }
}

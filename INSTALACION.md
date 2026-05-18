# 🧘 Studio LC Pilates — Guía de instalación

## Lo que vas a tener al final
- App instalada en tu celular como si fuera nativa
- Datos guardados en la nube (Firebase), disponibles siempre
- Funciona sin internet (modo offline con los últimos datos)
- URL propia para abrir desde cualquier dispositivo

---

## PASO 1 — Crear la base de datos Firebase (5 minutos)

1. Entrá a https://console.firebase.google.com
2. Hacé clic en **"Crear un proyecto"**
3. Nombre del proyecto: `studio-lc-pilates` → Continuar
4. Desactivá Google Analytics → **Crear proyecto**
5. Cuando termine, hacé clic en el ícono **`</>`** (Web)
6. Nombre de la app: `Studio LC Pilates` → **Registrar app**
7. Te va a mostrar un bloque de código así:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "studio-lc-pilates.firebaseapp.com",
  projectId: "studio-lc-pilates",
  storageBucket: "studio-lc-pilates.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

8. **Copiá esos valores** y pegálos en el archivo `src/firebase.js`
   reemplazando los textos que dicen `PEGAR_TU_..._AQUI`

### Activar Firestore:
9. En el menú izquierdo → **Build → Firestore Database**
10. Clic en **"Crear base de datos"**
11. Elegí **"Iniciar en modo de prueba"** → Siguiente → **Listo**

---

## PASO 2 — Subir la app a Vercel (3 minutos)

### Opción A — Sin saber programar (recomendada):

1. Creá una cuenta gratis en https://github.com
2. Creá una cuenta gratis en https://vercel.com (con tu cuenta de GitHub)
3. En GitHub: **New repository** → nombre: `studio-lc-pilates` → Create
4. Subí todos los archivos de esta carpeta al repositorio
5. En Vercel: **Add New Project** → importá el repositorio
6. Vercel detecta React automáticamente → clic en **Deploy**
7. En 2 minutos tenés tu URL: `studio-lc-pilates.vercel.app`

### Opción B — Desde la terminal (si tenés Node.js instalado):

```bash
# Dentro de la carpeta studio-lc-pilates:
npm install
npm run build
npx vercel --prod
```

---

## PASO 3 — Instalar en el celular como app

### En Android (Chrome):
1. Abrí la URL en Chrome
2. Tocá el menú (⋮) → **"Agregar a pantalla de inicio"**
3. Confirmá → ¡Listo! Aparece el ícono en tu pantalla

### En iPhone (Safari):
1. Abrí la URL en Safari (no Chrome)
2. Tocá el botón compartir (□↑) → **"Agregar a pantalla de inicio"**
3. Nombre: `Studio LC Pilates` → **Agregar**

---

## Listo! 🎉

A partir de ahora:
- Abrís la app desde el ícono como cualquier app
- Los datos se guardan solos en Firebase
- Si no tenés internet, funciona igual con los últimos datos guardados
- Se sincroniza automáticamente cuando volvés a tener conexión

---

## ¿Necesitás ayuda?

Cualquier duda, volvé a pedirle a Claude los pasos detallados.
El proyecto ya está configurado, solo necesitás pegar tu configuración
de Firebase en `src/firebase.js`.

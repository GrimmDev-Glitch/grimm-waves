# Grimm Waves Radio

Sitio de la radio, listo para GitHub Pages. Login de admin y datos (posts,
programación, configuración de la estación) corren por Firebase, gratis en
el plan Spark.

## 1. Crear el proyecto de Firebase

1. Andá a [console.firebase.google.com](https://console.firebase.google.com) → **Agregar proyecto** → seguí los pasos (no hace falta Google Analytics).
2. Dentro del proyecto: **⚙ Configuración del proyecto** → pestaña **General** → sección **Tus apps** → ícono `</>` (Web) → registrá la app (no hace falta Firebase Hosting).
3. Copiá el objeto `firebaseConfig` que te muestra y pegalo en `js/firebase-config.js`, reemplazando los valores de ejemplo. Es normal que esos valores queden públicos en el repo — no son contraseñas.

## 2. Activar Authentication

1. En el menú lateral: **Build → Authentication → Get started**.
2. Pestaña **Sign-in method** → activá **Email/Password**.
3. Pestaña **Users** → **Add user** → creá tu usuario admin (tu email + una contraseña). Con ese usuario vas a entrar desde el botón "Admin" del sitio.

> Repetí este paso por cada persona que quieras que pueda administrar el sitio.

## 3. Activar Firestore (la base de datos)

1. **Build → Firestore Database → Create database**. Elegí modo producción y la región que te quede más cerca.
2. Andá a la pestaña **Reglas** y pegá el contenido del archivo `firestore.rules` de este proyecto. Publicá los cambios.

Con eso: cualquiera puede leer los posts/programación (son públicos), pero solo alguien logueado (vos) puede crear o borrar.

## 3.5. Activar Storage (para poder subir imágenes en los posts)

1. **Build → Storage → Get started**. Si te pide elegir un plan de facturación (Blaze, "pago por uso"), es porque Google ahora lo pide para activar Storage por primera vez — igual **no te van a cobrar nada** mientras te mantengas dentro de la franja gratuita (5 GB de almacenamiento, bastante de sobra para imágenes de posts). Si preferís no cargar una tarjeta, simplemente no subas imágenes — el resto del sitio (posts con solo texto, video o enlace) funciona igual sin esto.
2. Andá a la pestaña **Reglas** de Storage y pegá el contenido del archivo `storage.rules` de este proyecto. Publicá los cambios.

## 4. Configurar tu stream

1. Publicá el sitio (paso 5) y entrá con tu usuario admin (botón **Admin** arriba a la derecha).
2. Hacé clic en el ⚙ que aparece al lado de "Editando como admin".
3. Completá:
   - **URL directa del stream**: el link de audio real (`https://stream.zeno.fm/xxxxxxxx` o tu URL de AzuraCast tipo `.../radio.mp3`).
   - **URL de Now Playing de AzuraCast** (opcional): si usás AzuraCast, algo como `https://tu-azuracast.com/api/nowplaying/tu_estacion` — el sitio va a mostrar la canción real que suena, actualizándose sola.
   - El resto de los campos son el texto manual que se muestra si no cargás una URL de Now Playing.
4. Guardar. Listo, el botón de play ya reproduce tu stream real.

## 5. Publicar en GitHub Pages

1. Creá un repositorio público nuevo en GitHub y subí todo el contenido de esta carpeta (`index.html`, `css/`, `js/`, `assets/`) a la raíz del repo.
2. En el repo: **Settings → Pages** → en "Build and deployment" elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guardar.
3. Esperá un par de minutos — GitHub te va a dar la URL pública (`https://tu-usuario.github.io/tu-repo/`).

## Posts con imagen, video o enlace

Al crear un post desde el panel admin podés sumar, de forma opcional:
- **Imagen**: se sube a Firebase Storage y queda clickeable para verse en tamaño completo.
- **Video**: pegá un link de YouTube — se embebe directo en el post destacado, y se usa su miniatura en los posts chicos.
- **Enlace externo**: se muestra como una tarjeta con el dominio, que abre el link en una pestaña nueva.

Ninguno es obligatorio — un post puede ser solo texto.

## Importante si ya tenías la versión anterior

Cambió cómo se guarda la programación: antes era un documento único por día, ahora cada programa es un documento propio en una colección `programs`, con sus días de transmisión adentro (así un mismo programa puede repetirse varios días sin cargarlo de nuevo). Si ya habías guardado programas con la versión vieja, no se migran solos — hay que volver a cargarlos desde el panel admin. Y como cambió el nombre de la colección, **volvé a pegar las reglas de `firestore.rules`** en Firebase Console → Firestore → Reglas, y publicalas de nuevo.

## Notas

- El repo es público, así que no pongas nunca contraseñas ni claves privadas en el código — solo se usa el `firebaseConfig`, que está pensado para ser público.
- Si en algún momento querés agregar más administradores, se hace desde Firebase Console → Authentication → Users, no hace falta tocar código.
- Los posts y la programación se guardan en Firestore, así que sobreviven aunque cambies de hosting.

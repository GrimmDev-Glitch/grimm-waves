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

## 4. Configurar tu stream

1. Publicá el sitio (paso 5) y entrá con tu usuario admin (botón **Admin** arriba a la derecha).
2. Hacé clic en el ⚙ que aparece al lado de "Editando como admin".
3. Completá:
   - **URL directa del stream**: el link de audio real (`https://stream.zeno.fm/xxxxxxxx`). Esta es la que usa el reproductor para sonar.
   - **Link "Stream directo" del footer**: la página pública para compartir (por defecto ya viene con `https://zeno.fm/radio/grimm-waves/`, cambiala si hace falta).
   - **URL de Now Playing de AzuraCast** (opcional, solo si no usás Zeno): si tu stream es Zeno, dejalo vacío — la canción que suena se detecta sola, en vivo, sin configurar nada más acá.
   - **Descripción corta**: el texto que aparece en el pie de página.
   - El resto son el texto manual de respaldo para "al aire" y "siguiente" por si todavía no cargaste programas en la grilla.
4. Guardar. Listo, el botón de play ya reproduce tu stream real.

## 5. Publicar en GitHub Pages

1. Creá un repositorio público nuevo en GitHub y subí **todo** el contenido de esta carpeta a la raíz del repo: `index.html`, `posts.html`, `contacto.html`, `enviar-musica.html`, `css/`, `js/`, `assets/`.
2. En el repo: **Settings → Pages** → en "Build and deployment" elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guardar.
3. Esperá un par de minutos — GitHub te va a dar la URL pública (`https://tu-usuario.github.io/tu-repo/`).

## Posts con imagen, video o enlace

Al crear o editar un post desde el panel admin (botón ✏️ en cada post) podés sumar, de forma opcional:
- **Imagen**: dos formas —
  1. Pegar directamente la URL de una imagen ya subida a algún lado (imgur, etc.)
  2. Subir un archivo: se guarda como un commit en tu propio repo de GitHub, usando la API de GitHub desde el navegador. Necesita configuración previa (ver abajo), una sola vez.
- **Video**: pegá un link de YouTube — se embebe directo en el post destacado, y se usa su miniatura en los posts chicos.
- **Enlace externo**: se muestra como una tarjeta con el dominio, que abre el link en una pestaña nueva.

Ninguno es obligatorio — un post puede ser solo texto. El botón ✏️ también sirve para corregir un post ya publicado.

### Configurar la subida de imágenes a GitHub (opcional, una sola vez)

Esto le permite al sitio subir imágenes directo a tu repo cuando elegís un archivo en vez de pegar una URL.

1. En GitHub: tu foto de perfil (arriba a la derecha) → **Settings** → en el menú de la izquierda, al final, **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Repository access**: elegí **Only select repositories** y seleccioná únicamente el repo de Grimm Waves (nunca des acceso a todos tus repos).
3. **Permissions → Repository permissions → Contents**: ponelo en **Read and write**. Todo lo demás, dejalo en "No access".
4. Generá el token y copialo (solo se muestra una vez).
5. En el sitio, con tu sesión de admin iniciada, hacé clic en el ícono 📦 del header → pegá el repo (`tu-usuario/tu-repo`), el token, y la rama (`main` salvo que la hayas renombrado) → Guardar.

Ese token queda guardado **solo en el almacenamiento local de ese navegador** — nunca se sube al repo ni se guarda en Firestore. Si subís el sitio desde otra computadora, hay que cargarlo de nuevo ahí. Si alguna vez querés revocarlo, lo borrás desde GitHub → Settings → Developer settings → Personal access tokens.

Las imágenes subidas así quedan guardadas en la carpeta `assets/uploads/` del repo, y tardan hasta un minuto en verse reflejadas (GitHub tarda un poco en servir un archivo recién subido).

## Las páginas nuevas: Posts, Contacto y Enviar música

- **posts.html**: lista TODOS los posts publicados (la portada solo muestra los últimos 5). Se administra desde la portada, no tiene nada propio para configurar.
- **contacto.html**: muestra tus redes/email. Entrando como admin aparece un panel para cargar Email, Instagram, TikTok, Twitch, Discord y X/Twitter — el campo que dejes vacío simplemente no se muestra.
- **enviar-musica.html**: un bloque de texto libre con las instrucciones para que te manden música. Como admin, hay una caja de texto para escribirlo como quieras (respeta los saltos de línea).

Ambos paneles de edición escriben en Firestore (`config/contact` y `config/submit`), así que ya están cubiertos por las mismas reglas de `firestore.rules` — no hay que tocar nada ahí.

## Importante si ya tenías la versión anterior

- La programación cambió de modelo: antes era un documento único por día, ahora cada programa es un documento propio en la colección `programs`, con sus días de transmisión adentro (un mismo programa puede repetirse varios días sin cargarlo de nuevo). Si ya habías cargado programas con la versión vieja, no se migran solos — hay que volver a cargarlos desde el panel.
- Se sacó Firebase Storage del proyecto entero (no hacía falta pagar por algo que podemos resolver con un link). Si habías llegado a activarlo, no pasa nada, simplemente ya no se usa.
- **Volvé a pegar `firestore.rules`** en Firebase Console → Firestore → Reglas, y publicalo de nuevo — agregamos la colección `programs`.

## ¿Qué es seguro que se vea público en el repo, y qué no?

Como el repo es público, cualquiera puede ver el contenido de `js/firebase-config.js` — incluido el `apiKey`. **Eso está bien, es intencional**, no hay nada que esconder ahí:

| Dato | ¿Dónde vive? | ¿Es un problema que se vea? |
|---|---|---|
| `firebaseConfig` (apiKey, authDomain, etc.) en `js/firebase-config.js` | En el repo, público | **No.** Es un identificador del proyecto, no una contraseña. Google lo diseñó para ir en el código del cliente. Lo que de verdad protege tus datos son las reglas de `firestore.rules` (solo alguien logueado puede escribir) |
| Tu contraseña de admin | Solo en Firebase Authentication (la pusiste desde la Consola) | No está en ningún archivo, nunca se sube al repo |
| El token de GitHub para subir imágenes | Solo en el `localStorage` de tu navegador (lo cargaste desde el ícono 📦) | No está en ningún archivo del repo. **Nunca lo pegues en un archivo que vayas a commitear** |

En resumen: no hay nada que tengas que ocultar antes de subir el repo tal como está. Lo único que exige cuidado de tu parte es no escribir el token de GitHub en ningún archivo — ese es el único dato realmente sensible de todo el proyecto, y por diseño nunca toca el repo.

## Notas

- Si en algún momento querés agregar más administradores, se hace desde Firebase Console → Authentication → Users, no hace falta tocar código.
- Los posts, la programación y la configuración se guardan en Firestore, así que sobreviven aunque cambies de hosting.
- Si después de subir una actualización el sitio se ve raro o "viejo", probá Ctrl+Shift+R (recarga forzada) — el navegador a veces guarda en caché los archivos .js/.css de una versión anterior.
- Si alguna vez sospechás que el token de GitHub se filtró, revocalo desde GitHub → Settings → Developer settings → Personal access tokens, y generá uno nuevo.

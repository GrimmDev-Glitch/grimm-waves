# Grimm Waves Radio

Sitio de la radio, listo para GitHub Pages. El login de admin y los datos
(posts, programación, configuración de la estación) funcionan con Firebase,
gratis en el plan Spark.

Es una sola página (`index.html`): Posts, Contacto y Enviar música son
secciones que se muestran u ocultan con JavaScript según el link que se
toque, en vez de ser páginas separadas. Así el reproductor de audio, que
vive fuera de esas secciones, nunca se recarga ni se corta al navegar.

## 1. Crear el proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) → **Agregar proyecto** → sigue los pasos (no hace falta Google Analytics).
2. Dentro del proyecto: **⚙ Configuración del proyecto** → pestaña **General** → sección **Tus apps** → ícono `</>` (Web) → registra la app (no hace falta Firebase Hosting).
3. Copia el objeto `firebaseConfig` que se muestra y pégalo en `js/firebase-config.js`, reemplazando los valores de ejemplo. Es normal que esos valores queden públicos en el repositorio — no son contraseñas.

## 2. Activar Authentication

1. En el menú lateral: **Build → Authentication → Get started**.
2. Pestaña **Sign-in method** → activa **Email/Password**.
3. Pestaña **Users** → **Add user** → crea tu usuario admin (tu email + una contraseña). Con ese usuario podrás entrar desde el botón "Admin" del sitio.

> Repite este paso por cada persona que quieras que pueda administrar el sitio.

## 3. Activar Firestore (la base de datos)

1. **Build → Firestore Database → Create database**. Elige modo producción y la región que te quede más cerca.
2. Ve a la pestaña **Reglas** y pega el contenido del archivo `firestore.rules` de este proyecto. Publica los cambios.

Con eso: cualquiera puede leer los posts/programación (son públicos), pero solo alguien que haya iniciado sesión puede crear o borrar. Los mensajes de contacto y los pedidos de canciones son la excepción: cualquiera puede *enviarlos*, pero solo el admin puede *leerlos* (son como un buzón privado).

## 4. Configurar tu stream

1. Publica el sitio (paso 5) y entra con tu usuario admin (botón **Admin** arriba a la derecha).
2. Haz clic en el ⚙ que aparece al lado de "Editando como admin".
3. Completa:
   - **URL directa del stream**: el link de audio real (`https://stream.zeno.fm/xxxxxxxx`). Es la que usa el reproductor para sonar.
   - **Link "Stream directo" del footer**: la página pública para compartir (por defecto ya viene con `https://zeno.fm/radio/grimm-waves/`, cámbiala si hace falta).
   - **URL de Now Playing de AzuraCast** (opcional, solo si no usas Zeno): si tu stream es Zeno, déjalo vacío — la canción que suena se detecta sola, en vivo, sin configurar nada más ahí.
   - **Descripción corta**: el texto que aparece en el pie de página.
   - El resto es el texto manual de respaldo para "al aire" y "siguiente" por si todavía no se cargaron programas en la grilla.
4. Guarda. Listo, el botón de play ya reproduce el stream real.

## 5. Publicar en GitHub Pages

1. Crea un repositorio público nuevo en GitHub y sube **todo** el contenido de esta carpeta a la raíz del repositorio: `index.html`, `css/`, `js/`, `assets/`, `firestore.rules`.
2. En el repositorio: **Settings → Pages** → en "Build and deployment" elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
3. Espera un par de minutos — GitHub dará la URL pública (`https://tu-usuario.github.io/tu-repo/`).

## Posts tipo blog: contenido completo, varias imágenes, video o enlace

Cada post tiene ahora una página propia (se abre haciendo clic en cualquier parte de la tarjeta, en `#post/<id>`). Al crear o editar un post desde el panel admin (botón ✏️) hay estos campos:

- **Resumen**: el texto corto que se ve en la vista previa (tarjetas de la portada y del listado).
- **Contenido completo**: el texto largo del post, el que se lee al abrirlo. Se puede escribir todo lo que haga falta — dejando una línea en blanco se arma un párrafo nuevo.
- **Imágenes**: se pueden cargar varias, una URL por línea (la primera es la que se usa como portada en las tarjetas). Dos formas de cargarlas —
  1. Pegar directamente la URL de una imagen ya subida a algún lado (imgur, etc.)
  2. Subir un archivo: se agrega solo a la lista de arriba, guardándose como un commit en el propio repositorio de GitHub. Necesita configuración previa (ver abajo), una sola vez.
- **Video**: pega un link de YouTube — se embebe directo en la página del post, y se usa su miniatura en las tarjetas de vista previa.
- **Enlace externo**: se muestra como una tarjeta con el dominio, que abre el link en una pestaña nueva.

Ninguno es obligatorio salvo el título — un post puede ser solo texto. El botón ✏️ (tanto en las tarjetas como dentro de la página del post) sirve para corregir un post ya publicado.

### Configurar la subida de imágenes a GitHub (opcional, una sola vez)

Esto le permite al sitio subir imágenes directo al repositorio cuando se elige un archivo en vez de pegar una URL.

1. En GitHub: foto de perfil (arriba a la derecha) → **Settings** → en el menú de la izquierda, al final, **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Repository access**: elige **Only select repositories** y selecciona únicamente el repositorio de Grimm Waves (nunca dar acceso a todos los repositorios).
3. **Permissions → Repository permissions → Contents**: ponlo en **Read and write**. Todo lo demás, déjalo en "No access".
4. Genera el token y cópialo (solo se muestra una vez).
5. En el sitio, con la sesión de admin iniciada, haz clic en el ícono 📦 del header → pega el repositorio (`tu-usuario/tu-repo`), el token, y la rama (`main` salvo que se haya renombrado) → Guardar.

Ese token queda guardado **solo en el almacenamiento local de ese navegador** — nunca se sube al repositorio ni se guarda en Firestore. Si se publica el sitio desde otra computadora, hay que cargarlo de nuevo ahí. Si en algún momento se quiere revocar, se borra desde GitHub → Settings → Developer settings → Personal access tokens.

Las imágenes subidas así quedan guardadas en la carpeta `assets/uploads/` del repositorio, y tardan hasta un minuto en verse reflejadas (GitHub tarda un poco en servir un archivo recién subido).

## La sección "En vivo" (Twitch, X/Twitter, redes)

Nueva sección (`#view-vivo`) con:
- **Twitch embebido**: el reproductor oficial de Twitch, incrustado directo en el sitio. Arranca silenciado y sin autoplay a propósito, para que no se mezcle con el audio de la radio si alguien está escuchando.
- **Timeline de X/Twitter**: los últimos tuits de la cuenta que cargues, con el widget oficial de Twitter.
- **Botones de seguimiento**: Twitch, X/Twitter, Instagram y TikTok — el que no cargues, simplemente no aparece.

Como admin, el panel para cargar esto está al final de esa misma sección. Los datos quedan en `config/social` (ya cubierto por las reglas genéricas de `config/{docId}`, no hace falta tocar `firestore.rules`).

Un detalle técnico sobre Twitch: el embed exige que el dominio donde vive la página esté autorizado (lo arma el propio código, usando el dominio real donde esté publicado el sitio, así que no hay que configurar nada aparte — pero si algún día se usa un dominio propio en vez del de GitHub Pages, el embed se sigue ajustando solo).

## Las secciones Posts, Contacto y Enviar música

Ya no son páginas separadas — son secciones de la misma `index.html` que se muestran con los links `#view-posts`, `#view-contacto` y `#view-enviar` del menú.

- **Posts**: lista todos los posts publicados (la portada solo muestra los últimos 5). Se administra igual que desde la portada (mismo botón ✏️).
- **Contacto**: muestra las redes/el email de la estación (editable como admin), y además tiene un formulario público para que cualquiera mande un mensaje directo. Como admin aparece una lista con todos los mensajes recibidos, con botón para borrar cada uno.
- **Enviar música**: un bloque de texto libre con las instrucciones (editable como admin), y un formulario público para pedir canciones (nombre, canción/artista, nota opcional). Como admin aparece la lista de pedidos recibidos, con botón para borrar cada uno.

Los mensajes y los pedidos son privados: cualquiera puede enviarlos, pero solo el admin puede verlos (están cubiertos por las reglas nuevas de `firestore.rules` — hay que volver a pegarlas si venías de una versión anterior, ver más abajo).

## Importante si ya existía la versión anterior

- **Cambió la estructura del sitio**: antes `posts.html`, `contacto.html` y `enviar-musica.html` eran archivos separados; ahora todo vive en `index.html` como secciones que se muestran con JavaScript. Si ya se habían subido esos archivos sueltos al repositorio, se pueden borrar — ya no se usan (no rompen nada si quedan, pero no hacen falta).
- La programación cambió de modelo: antes era un documento único por día, ahora cada programa es un documento propio en la colección `programs`, con sus días de transmisión adentro (un mismo programa puede repetirse varios días sin cargarlo de nuevo). Si ya había programas cargados con la versión vieja, no se migran solos — hay que volver a cargarlos desde el panel.
- Se quitó Firebase Storage del proyecto entero (no hacía falta pagar por algo que se puede resolver con un link). Si se había llegado a activar, no pasa nada, simplemente ya no se usa.
- **Hay que volver a pegar `firestore.rules`** en Firebase Console → Firestore → Reglas, y publicarlo de nuevo — se agregaron las colecciones `programs`, `messages` y `requests`.

## ¿Qué es seguro que se vea público en el repositorio, y qué no?

Como el repositorio es público, cualquiera puede ver el contenido de `js/firebase-config.js` — incluido el `apiKey`. **Eso está bien, es intencional**, no hay nada que esconder ahí:

| Dato | ¿Dónde vive? | ¿Es un problema que se vea? |
|---|---|---|
| `firebaseConfig` (apiKey, authDomain, etc.) en `js/firebase-config.js` | En el repositorio, público | **No.** Es un identificador del proyecto, no una contraseña. Google lo diseñó para ir en el código del cliente. Lo que de verdad protege los datos son las reglas de `firestore.rules` (solo alguien que inició sesión puede escribir) |
| La contraseña de admin | Solo en Firebase Authentication (se definió desde la Consola) | No está en ningún archivo, nunca se sube al repositorio |
| El token de GitHub para subir imágenes | Solo en el `localStorage` del navegador (se cargó desde el ícono 📦) | No está en ningún archivo del repositorio. **Nunca pegarlo en un archivo que se vaya a subir** |

En resumen: no hay nada que ocultar antes de subir el repositorio tal como está. Lo único que exige cuidado es no escribir el token de GitHub en ningún archivo — ese es el único dato realmente sensible de todo el proyecto, y por diseño nunca toca el repositorio.

## Notas

- Si en algún momento se quieren agregar más administradores, se hace desde Firebase Console → Authentication → Users, no hace falta tocar código.
- Los posts, la programación, los mensajes y los pedidos se guardan en Firestore, así que sobreviven aunque cambie el hosting.
- Si después de subir una actualización el sitio se ve raro o "viejo", probar Ctrl+Shift+R (recarga forzada) — el navegador a veces guarda en caché los archivos .js/.css de una versión anterior.
- Si en algún momento se sospecha que el token de GitHub se filtró, revocarlo desde GitHub → Settings → Developer settings → Personal access tokens, y generar uno nuevo.

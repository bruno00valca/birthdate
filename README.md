# 🎁 Felicitación de cumpleaños — Viaje sorpresa a Copenhague

SPA sencilla (una sola página con scroll) para felicitar y desvelar un regalo:
un viaje a **Copenhague, del 30 de agosto al 2 de septiembre**.

Al abrir la página se ve una felicitación con una **cajita de regalo** y un
**temporizador**: hasta que llega a cero, la caja se agita al pulsarla pero no se
abre, y el resto de la página no se puede ver. Cuando toca, se pulsa la caja: se
abre con **confeti** y revela el viaje. Al bajar, un **avión despega de Madrid**
sobre el mapa de Europa, da un rodeo dejando una estela de líneas discontinuas y
**aterriza en Copenhague** (ahí se desvela el destino). Después están las
**tarjetas del viaje** (fechas, vuelos, alojamiento) y el **itinerario día a día**
en una *timeline* vertical.

Hecho con **HTML + CSS + JavaScript vanilla**. Sin build, sin dependencias que instalar.

---

## ▶️ Cómo verlo en local

Aunque puedes abrir `index.html` directamente en el navegador, es mejor usar un
servidor estático (así las imágenes y el confeti cargan sin problemas de rutas):

```bash
# Desde la carpeta del proyecto
python3 -m http.server 8000
```

Luego abre <http://localhost:8000> en el navegador.

> Alternativas equivalentes: `npx serve`, la extensión *Live Server* de VS Code, etc.

---

## ✏️ Qué personalizar

Busca las marcas `✏️ EDITAR` en el código. Los puntos a rellenar son:

| Dónde | Qué cambiar |
|-------|-------------|
| `index.html` → `.hero__msg--wait` | El mensaje que se ve **mientras el regalo está bloqueado**. |
| `index.html` → `.hero__msg--party` | El **nombre** y la **dedicatoria** de cumpleaños. |
| `js/main.js` → `UNLOCK_AT` | **Fecha y hora** en que se desbloquea el regalo. |
| `js/main.js` → `TEASES` | Los mensajitos al pulsar el regalo **antes de la hora**. |
| `index.html` → `.gate__note` | El mensaje que acompaña al temporizador. |
| `index.html` → tarjeta *Vuelos* | Aerolínea y horarios reales de ida/vuelta. |
| `index.html` → tarjeta *Alojamiento* | Hotel, zona y noches. |
| `index.html` → *timeline* | Ajusta las actividades de cada día a vuestro gusto. |
| `index.html` → footer | Mensaje de cierre y firma. |
| `js/main.js` → `TRIP_START` / `TRIP_END` | Fechas del viaje (alimentan el contador de días). |
| `js/main.js` → `FLIGHT_MIN_MS` / `FLIGHT_MAX_MS` | Cuánto dura el vuelo del avión. |
| `js/main.js` → `LEGS_TO_ITALY` / `ITALY_STOPS` / `LEGS_TO_CPH` | Rodeos que puede dar el avión. |

---

## ⏳ El temporizador (el regalo con hora)

El regalo **no se puede abrir hasta el momento marcado en `UNLOCK_AT`**
(`js/main.js`), ahora mismo el **13 de agosto de 2026 a las 00:00**. Se usa la
**hora local del dispositivo** de quien mira la página.

Mientras la cuenta atrás corre:

- En la portada **no se felicita nada todavía**: el `<body>` lleva la clase
  `is-waiting` y en el hueco del titular se ve el mensaje de espera
  (`.hero__msg--wait`) en vez de la felicitación (`.hero__msg--party`).
- En la portada se ve un recuadro con **días, horas, minutos y segundos**, cada
  unidad con un color de Nyhavn. Los segundos van al segundo, y la cifra se
  recalcula desde la hora del sistema en cada latido, así que **no se desfasa**
  aunque el navegador congele la pestaña de fondo.
- La cajita **no lleva candado ni pinta de bloqueada**: al pulsarla se **agita**,
  la tapa hace por abrirse y vuelve a su sitio, y debajo aparece un mensajito
  (`TEASES`, van por turnos) que se borra a los 2,6 s.
- El **viaje, el itinerario y el footer no existen**: el `<body>` lleva la clase
  `is-sealed` y las tres secciones la clase `gated` (`.is-sealed .gated { display: none }`).
  Se destapan al abrir el regalo, no al llegar a cero. Así el avión tampoco
  despega antes de tiempo: su animación arranca cuando el mapa entra en pantalla.
- Los lectores de pantalla no oyen cada segundo: el reloj va `aria-hidden` y hay
  un texto oculto que se actualiza **una vez por minuto** ("Faltan 2 días y 12
  horas para abrir el regalo").

Al llegar a cero, sin recargar nada: el reloj deja paso a **"¡Ya es la hora! Abre
tu regalo 🎁"**, el mensaje de espera se cambia por el **"¡¡Feliz cumpleaños!!"**
(que entra con un saltito), salta una ráfaga de confeti suave y la caja ya se
abre. Si se entra en la página **después** de esa hora, el temporizador no
aparece siquiera y la felicitación ya está puesta desde el primer momento.

Con `prefers-reduced-motion` la caja no se agita (solo cambia el mensaje). Y
**sin JavaScript** no hay bloqueo posible: se ve la página entera desde el
principio, como antes.

## ✈️ La animación del vuelo

El banner de la sección *El regalo* es un **mapa de Europa en SVG** sobre el que vuela
un avión de Madrid a Copenhague:

- Los contornos de los países están en **`js/europa-map.js`** (paths SVG ya
  proyectados) junto a las coordenadas de las ciudades. El SVG lo monta `js/main.js`.
- El avión **despega al entrar el mapa en pantalla** y el vuelo dura entre 12 y 17
  segundos (`FLIGHT_MIN_MS` / `FLIGHT_MAX_MS`), con este guion:
  1. **Acercamiento** (unos 3 s) por el Mediterráneo o por Francia.
  2. **Tirabuzón sobre Italia** (4-6 s): da una o dos vueltas completas a la mitad
     de velocidad (`ITALY_SPEED`) mientras se ilumina el punto del centro, como si
     el destino fuera ese.
  3. **Rodeo hacia el norte**, a veces con otro rizo de propina por el camino.
  4. **Aterrizaje en Copenhague**: chincheta, confeti pequeño y el nombre del
     destino con la bandera danesa en el título.
- La **ruta es distinta en cada visita**: se combinan al azar los tramos de
  `LEGS_TO_ITALY`, `ITALY_STOPS` y `LEGS_TO_CPH`, se mueven un poco los puntos de
  paso, se curvan los tramos largos y cambian el radio y el sentido del tirabuzón.
- Se iluminan **como máximo 3 puntos** del mapa (`MAX_STOPS`): el del tirabuzón y
  uno o dos del camino, sin etiqueta ninguna. Se encienden al llegar el avión y se
  apagan al dejarlos atrás. El reparto (cuántos antes y cuántos después del rizo)
  cambia en cada vuelo, así que el de Italia no es siempre el primero ni el último.
  No se marcan puntos pegados a Madrid, a Copenhague ni al propio tirabuzón.
- El botón **↻ Repetir el vuelo** lanza otra ruta nueva.
- Con `prefers-reduced-motion` se muestra el mapa con la ruta ya dibujada, sin vuelo.
  Si no hay JavaScript, en su lugar se ve la foto de Nyhavn.
- La bandera de Dinamarca del título es un **SVG**, no un emoji: los emoji de
  banderas no se ven en Windows.

Para cambiar el encuadre del mapa, los países o las ciudades de paso hay que
regenerar los datos con el script incluido (solo necesita Python, sin dependencias):

```bash
curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
python3 tools/generar-mapa.py ne_50m_admin_0_countries.geojson   # reescribe js/europa-map.js
```

---

## 🖼️ Imágenes

Las fotos están en `assets/img/` y son de **Wikimedia Commons con licencia libre**.
La atribución de cada una está en [`assets/img/CREDITS.txt`](assets/img/CREDITS.txt).

- Usadas en la página: `nyhavn.jpg`, `tivoli.jpg`, `sirenita.jpg`, `rosenborg.jpg`.
  `nyhavn.jpg` es además la imagen de reserva del banner si no hay JavaScript.
- De repuesto (por si quieres cambiarlas): `amalienborg.jpg`, `rundetaarn.jpg`.

Para usar **tus propias fotos**, sustituye los archivos en `assets/img/`
(manteniendo el nombre) o cambia las rutas de los `<img>` en `index.html`.

### Icono de la pestaña

Un regalito con la paleta de Nyhavn, en tres formatos (los tres están ya
commiteados en `assets/`):

| Archivo | Para qué |
|---------|----------|
| `favicon.svg` | La pestaña en Chrome, Firefox y Edge (nítido a cualquier tamaño). |
| `favicon.ico` | Respaldo en 16/32/48 px para quien no carga SVG, como Safari. |
| `apple-touch-icon.png` | 180 px, el icono al guardar la página en la pantalla de inicio del iPhone. |

El dibujo se describe una sola vez en el script y de ahí salen los tres
archivos, así que no hay dos versiones que se puedan desincronizar:

```bash
python3 tools/generar-favicon.py   # reescribe los tres archivos de assets/
```

---

## 🎨 Estilo

Paleta inspirada en las casas de colores de **Nyhavn** (rojo, mostaza, azul, verde)
sobre un lienzo blanco y minimalista. Los colores se definen como variables CSS al
inicio de `css/styles.css` (`--nyhavn-red`, `--nyhavn-blue`, …); cámbialos ahí si quieres.

Es **responsive** (mobile-first) y se adapta a móvil, tablet y PC. También respeta
`prefers-reduced-motion` (desactiva animaciones y confeti para quien lo prefiera).

---

## 📦 Dependencias

- **[canvas-confetti]** para el confeti, incluido en local (`js/confetti.browser.min.js`)
  para que funcione sin conexión. Licencia ISC.
- **Natural Earth** (dominio público) como origen de los contornos del mapa de
  `js/europa-map.js`. No hace falta descargar nada: los datos ya van en el repo.
- **Google Fonts** (Fraunces + Poppins) vía `<link>`, con *fallback* a fuentes del
  sistema si no hay internet.

[canvas-confetti]: https://github.com/catdad/canvas-confetti

---

## 🚀 Despliegue (cuando quieras compartirlo)

Al ser un sitio **estático**, cualquier hosting estático vale. Opciones fáciles:

- **GitHub Pages**: sube el repo a GitHub y en *Settings → Pages* elige la rama `main`
  y carpeta `/root`. Tendrás una URL pública para enviar por WhatsApp.
- **Netlify / Vercel**: arrastra la carpeta o conecta el repo; despliegue automático.

Se abre igual de bien desde el móvil, la tablet o el PC.

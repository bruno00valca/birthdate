# 🎁 Felicitación de cumpleaños — Viaje sorpresa a Copenhague

SPA sencilla (una sola página con scroll) para felicitar y desvelar un regalo:
un viaje a **Copenhague, del 30 de agosto al 2 de septiembre**.

Al abrir la página se ve una felicitación con una **cajita de regalo**. Al pulsarla,
se abre con **confeti** y revela el viaje. Al bajar, un **avión despega de Madrid**
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
| `index.html` → hero | El **nombre** (`[NOMBRE]`) y el **texto de la dedicatoria**. |
| `index.html` → tarjeta *Vuelos* | Aerolínea y horarios reales de ida/vuelta. |
| `index.html` → tarjeta *Alojamiento* | Hotel, zona y noches. |
| `index.html` → *timeline* | Ajusta las actividades de cada día a vuestro gusto. |
| `index.html` → footer | Mensaje de cierre y firma. |
| `js/main.js` → `TRIP_START` / `TRIP_END` | Fechas del viaje (alimentan el contador de días). |
| `js/main.js` → `FLIGHT_MIN_MS` / `FLIGHT_MAX_MS` | Cuánto dura el vuelo del avión. |
| `js/main.js` → `LEGS_TO_ITALY` / `ITALY_STOPS` / `LEGS_TO_CPH` | Rodeos que puede dar el avión. |

---

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

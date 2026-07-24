# 🎁 Felicitación de cumpleaños — Viaje sorpresa a Copenhague

SPA sencilla (una sola página con scroll) para felicitar y desvelar un regalo:
un viaje a **Copenhague, del 30 de agosto al 2 de septiembre**.

Al abrir la página se ve una felicitación con una **cajita de regalo**. Al pulsarla,
se abre con **confeti** y revela el viaje. Al bajar aparecen las **tarjetas del viaje**
(fechas, vuelos, alojamiento) y el **itinerario día a día** en una *timeline* vertical.

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

---

## 🖼️ Imágenes

Las fotos están en `assets/img/` y son de **Wikimedia Commons con licencia libre**.
La atribución de cada una está en [`assets/img/CREDITS.txt`](assets/img/CREDITS.txt).

- Usadas en la página: `nyhavn.jpg`, `tivoli.jpg`, `sirenita.jpg`, `rosenborg.jpg`.
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

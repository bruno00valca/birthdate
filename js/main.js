/* =================================================================
   Lógica de la felicitación
   - Abrir el regalo (+ confeti)
   - Contador de días que faltan para el viaje
   - Vuelo animado Madrid → Copenhague sobre el mapa de Europa
   - Animaciones de aparición al hacer scroll
================================================================= */
(function () {
  "use strict";

  // ✏️ EDITAR: fechas del viaje (año, mes 1-12, día)
  var TRIP_START = { y: 2026, m: 8, d: 30 }; // 30 de agosto de 2026
  var TRIP_END   = { y: 2026, m: 9, d: 2 };  // 2 de septiembre de 2026

  // Paleta de Nyhavn, para el confeti
  var PALETTE = ["#d8402f", "#f0a92b", "#2c6e9b", "#3e7c5a", "#ffffff"];

  var prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --------------------------------------------------------------
  // 0) Todo lo que va debajo del mapa (tarjetas, itinerario y pie)
  //    está escondido hasta que el avión aterriza. La clase la pone el
  //    script del <head> (así no se ve ni un instante) y la quitamos
  //    aquí: al aterrizar o si el vuelo no se puede animar.
  // --------------------------------------------------------------
  var belowShown = false;
  window.FLIGHT_READY = true;   // avisa al script del <head>: ya mandamos nosotros

  function showBelowFlight() {
    if (belowShown) return;
    belowShown = true;
    document.documentElement.classList.remove("is-boarding");
  }

  // --------------------------------------------------------------
  // 1) Abrir el regalo
  // --------------------------------------------------------------
  function initGift() {
    var gift = document.getElementById("gift");
    var reveal = document.getElementById("reveal");
    var hint = document.getElementById("giftHint");
    if (!gift || !reveal) return;

    var opened = false;

    gift.addEventListener("click", function () {
      if (opened) return;
      opened = true;

      gift.classList.add("is-open");
      gift.setAttribute("aria-expanded", "true");
      if (hint) hint.textContent = "🎉 ¡Sorpresa!";

      // Mostrar la sorpresa con un pequeño retardo (mientras se abre la tapa)
      window.setTimeout(function () {
        reveal.hidden = false;
        reveal.classList.add("is-shown");
        launchConfetti();
      }, prefersReducedMotion ? 0 : 350);
    });
  }

  // --------------------------------------------------------------
  // 2) Confeti (si la librería está disponible y hay movimiento)
  // --------------------------------------------------------------
  function launchConfetti() {
    if (typeof window.confetti !== "function" || prefersReducedMotion) return;

    // Ráfaga central
    window.confetti({
      particleCount: 140,
      spread: 90,
      startVelocity: 45,
      origin: { y: 0.6 },
      colors: PALETTE,
    });
    // Ráfagas laterales para dar volumen
    window.setTimeout(function () {
      window.confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 }, colors: PALETTE });
      window.confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 }, colors: PALETTE });
    }, 220);
  }

  // --------------------------------------------------------------
  // 3) Contador de días para el viaje
  // --------------------------------------------------------------
  function initCountdown() {
    var el = document.getElementById("countdown");
    if (!el) return;

    var MS_DAY = 86400000;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var start = new Date(TRIP_START.y, TRIP_START.m - 1, TRIP_START.d);
    var end = new Date(TRIP_END.y, TRIP_END.m - 1, TRIP_END.d);

    var days = Math.round((start - today) / MS_DAY);

    var text;
    if (days > 1) text = "Faltan " + days + " días ✨";
    else if (days === 1) text = "¡Mañana salimos! ✈️";
    else if (days === 0) text = "¡Es hoy! 🎉";
    else if (today <= end) text = "¡De viaje! ✈️";
    else text = "Un viaje inolvidable 💙";

    el.textContent = text;
  }

  // --------------------------------------------------------------
  // 4) El vuelo: el avión despega de Madrid, da una vuelta por Europa
  //    dejando una estela discontinua y aterriza en Copenhague.
  // --------------------------------------------------------------
  var SVG_NS = "http://www.w3.org/2000/svg";

  // Avión visto desde arriba, con el morro hacia la derecha (eje +x)
  var PLANE_PATH =
    "M20,0C18.4,-1.8 13,-3.3 6.5,-3.9L3.5,-4.2L-4.5,-15.5L-9,-15.5L-6.4,-4.6" +
    "L-13.5,-4.2L-17.5,-8.8L-20.5,-8.8L-19.2,-3C-20.6,-1.6 -20.6,1.6 -19.2,3" +
    "L-20.5,8.8L-17.5,8.8L-13.5,4.2L-6.4,4.6L-9,15.5L-4.5,15.5L3.5,4.2L6.5,3.9" +
    "C13,3.3 18.4,1.8 20,0Z";

  // Trazos de la estela (en unidades del viewBox del mapa)
  var DASH_LEN = 15;
  var DASH_GAP = 11;

  // ✏️ EDITAR: duración del vuelo (ms). Se ajusta sola dentro de estos
  // límites según lo largo que salga el recorrido.
  var FLIGHT_MIN_MS = 12000;
  var FLIGHT_MAX_MS = 17000;

  // Cuánto se arrastra el avión sobre Italia (1 = velocidad normal)
  var ITALY_SPEED = 0.5;

  // Puntos del mapa que se iluminan al pasar el avión (contando el del
  // tirabuzón). El resto del camino no se marca.
  var MAX_STOPS = 3;

  // Tramos del recorrido (códigos de ciudad de js/europa-map.js):
  // Madrid → acercamiento → tirabuzón sobre Italia → rodeo → Copenhague.
  var LEGS_TO_ITALY = [
    ["BCN", "MRS"],
    ["BCN"],
    ["BOD", "MRS"],
    ["MRS", "MIL"],
    ["BCN", "MRS", "MIL"]
  ];
  var ITALY_STOPS = ["ROM", "FLR", "NAP"];
  var LEGS_TO_CPH = [
    ["VCE", "VIE", "PRG", "BER"],
    ["ZAG", "BUD", "KRK", "WAW", "GDN"],
    ["VCE", "MUC", "PRG", "BER", "HAM"],
    ["MIL", "ZRH", "PAR", "AMS", "HAM"],
    ["ZAG", "VIE", "KRK", "WAW", "STO"],
    ["VCE", "VIE", "PRG", "BER", "OSL"]
  ];

  var HINT_FLYING = "El avión ya ha despegado… ¿a dónde va? ✈️";
  var HINT_LANDED = "¡Aterrizamos en Copenhague!";
  var HINT_STATIC = "La ruta del viaje: Madrid ✈️ Copenhague";

  function initFlight() {
    var data = window.EUROPA_MAP;
    var fig = document.getElementById("flight");
    var host = document.getElementById("flightMap");
    // Si no hay mapa que animar, no hay nada que esperar: se ve todo
    if (!data || !fig || !host) return showBelowFlight();
    if (!data.cities || !data.cities.MAD || !data.cities.CPH) return showBelowFlight();

    host.insertAdjacentHTML("afterbegin", buildMapSvg(data));

    var svg = host.querySelector(".map");
    var route = host.querySelector(".map__route");
    var trail = host.querySelector(".map__trail");
    var plane = host.querySelector(".map__plane");
    // Sin soporte de SVG (o de su API de geometría) dejamos la foto de reserva
    if (!route || !trail || !plane || typeof route.getTotalLength !== "function") {
      if (svg) host.removeChild(svg);
      return showBelowFlight();
    }

    var stopEls = host.getElementsByClassName("map__stop");
    placePin(document.getElementById("flightPinFrom"), data.cities.MAD, data);
    placePin(document.getElementById("flightPinTo"), data.cities.CPH, data);
    fig.classList.add("is-ready");

    var dest = document.getElementById("tripDest");
    var hint = document.getElementById("tripHint");
    var replay = document.getElementById("tripReplay");

    var length = 0;    // longitud de la ruta actual
    var dashes = [];   // trazos de la estela, con el punto en que se encienden
    var italy = null;  // centro y radio del tirabuzón
    var stops = [];    // puntos que se iluminan al pasar por encima
    var timeTable = [];  // longitud recorrida ↔ tiempo, para variar la velocidad
    var totalTime = 0;

    // Traza un recorrido nuevo (aleatorio) y prepara su estela
    function prepareRoute() {
      var flight = buildFlight(data);
      italy = flight.italy;
      stops = flight.stops;
      route.setAttribute("d", flight.d);
      length = route.getTotalLength();
      dashes = buildDashes(route, length, trail);
      buildTimeTable();

      // Cada punto del vuelo se lleva una chincheta del mapa (apagada)
      for (var i = 0; i < stopEls.length; i++) {
        stopEls[i].classList.remove("is-lit");
        if (!stops[i]) continue;
        stops[i].el = stopEls[i];
        stops[i].lit = false;
        stops[i].done = false;
        moveMarker(stopEls[i], stops[i].point);
      }
    }

    // Enciende el punto al que llega el avión y apaga el que deja atrás
    function updateStops(p) {
      stops.forEach(function (stop) {
        if (!stop.el) return;
        var dx = p.x - stop.point[0];
        var dy = p.y - stop.point[1];
        var away = Math.sqrt(dx * dx + dy * dy);
        if (!stop.lit && !stop.done && away < stop.near) {
          stop.lit = true;
          stop.el.classList.add("is-lit");
        } else if (stop.lit && away > stop.far) {
          stop.lit = false;
          stop.done = true;
          stop.el.classList.remove("is-lit");
        }
      });
    }

    // Sobre Italia el avión se arrastra: parece que se va a quedar ahí
    function speedAt(point) {
      var dx = point.x - italy.center[0];
      var dy = point.y - italy.center[1];
      var away = Math.sqrt(dx * dx + dy * dy);
      var inner = italy.radius * 1.1;
      var outer = italy.radius * 2;
      if (away >= outer) return 1;
      if (away <= inner) return ITALY_SPEED;
      var k = (away - inner) / (outer - inner);
      return ITALY_SPEED + (1 - ITALY_SPEED) * k * k * (3 - 2 * k);
    }

    // Tabla longitud → tiempo: integra el perfil de velocidad por tramos
    function buildTimeTable() {
      var step = 5;
      var elapsed = 0;
      timeTable = [{ at: 0, time: 0 }];
      for (var at = 0; at < length; at += step) {
        var span = Math.min(step, length - at);
        elapsed += span / speedAt(route.getPointAtLength(at + span / 2));
        timeTable.push({ at: at + span, time: elapsed });
      }
      totalTime = elapsed;
    }

    // Cuánto se ha recorrido cuando ha pasado esta fracción del vuelo
    function lengthAtTime(fraction) {
      var target = fraction * totalTime;
      var lo = 0;
      var hi = timeTable.length - 1;
      while (lo < hi - 1) {
        var mid = (lo + hi) >> 1;
        if (timeTable[mid].time <= target) lo = mid;
        else hi = mid;
      }
      var from = timeTable[lo];
      var to = timeTable[hi];
      var span = to.time - from.time;
      return from.at + (to.at - from.at) * (span > 0 ? (target - from.time) / span : 0);
    }

    function movePlane(at, progress) {
      var p = route.getPointAtLength(at);
      var back = route.getPointAtLength(Math.max(0, at - 5));
      var ahead = route.getPointAtLength(Math.min(length, at + 5));
      var deg = Math.atan2(ahead.y - back.y, ahead.x - back.x) * 180 / Math.PI;
      // Gana y pierde "altura" para que se note el despegue y el aterrizaje
      var scale = 0.92 + 0.33 * Math.sin(Math.PI * progress);
      plane.setAttribute(
        "transform",
        "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ") " +
        "rotate(" + deg.toFixed(1) + ") scale(" + scale.toFixed(3) + ")"
      );
      return p;
    }

    function land() {
      dashes.forEach(function (dash) { dash.el.classList.add("is-on"); });
      stops.forEach(function (stop) {
        if (stop.el) stop.el.classList.remove("is-lit");
      });
      fig.classList.remove("is-flying");
      fig.classList.add("is-landed");
      if (dest) {
        dest.classList.remove("is-secret");
        dest.classList.add("is-revealed");
      }
      if (hint) hint.textContent = HINT_LANDED;
      if (replay) { replay.hidden = false; replay.disabled = false; }
      // Ya se puede ver el resto del viaje (una vez desvelado, se queda)
      showBelowFlight();
      landingConfetti(host, data);
    }

    function startFlight() {
      prepareRoute();
      fig.classList.remove("is-landed");
      fig.classList.add("is-flying");
      if (dest) {
        dest.classList.remove("is-revealed");
        dest.classList.add("is-secret");
      }
      if (hint) hint.textContent = HINT_FLYING;
      if (replay) replay.disabled = true;

      // Cuanto más rodeo (y más rato sobre Italia), más dura el vuelo
      var duration = Math.max(FLIGHT_MIN_MS, Math.min(FLIGHT_MAX_MS, totalTime * 6));
      var t0 = null;
      var next = 0;

      movePlane(0, 0);
      window.requestAnimationFrame(function frame(now) {
        if (t0 === null) t0 = now;
        var t = Math.min(1, (now - t0) / duration);
        var eased = t * t * (3 - 2 * t);  // salida y llegada suaves
        var travelled = lengthAtTime(eased);

        var p = movePlane(travelled, t);
        while (next < dashes.length && dashes[next].at <= travelled) {
          dashes[next].el.classList.add("is-on");
          next++;
        }
        updateStops(p);

        if (t < 1) window.requestAnimationFrame(frame);
        else land();
      });
    }

    // Quien prefiere no ver movimiento: mapa con la ruta ya dibujada
    if (prefersReducedMotion) {
      prepareRoute();
      dashes.forEach(function (dash) { dash.el.classList.add("is-on"); });
      stops.forEach(function (stop) {
        if (stop.el) stop.el.classList.add("is-lit");
      });
      movePlane(length, 1);
      fig.classList.add("is-landed");
      if (hint) hint.textContent = HINT_STATIC;
      showBelowFlight();
      return;
    }

    // El destino no se lee hasta que el avión aterriza
    if (dest) dest.classList.add("is-secret");
    if (replay) replay.addEventListener("click", startFlight);

    // Despega cuando el mapa entra en pantalla
    if (!("IntersectionObserver" in window)) {
      startFlight();
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          window.setTimeout(startFlight, 400);  // deja acabar el fundido
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(fig);
  }

  // Mapa de Europa + capas de la animación
  function buildMapSvg(data) {
    var mad = data.cities.MAD;
    var cph = data.cities.CPH;
    var svg = [];

    svg.push('<svg class="map" viewBox="0 0 ' + data.width + " " + data.height +
             '" xmlns="' + SVG_NS + '" aria-hidden="true" focusable="false">');
    svg.push('<defs><linearGradient id="mapLandGrad" x1="0" y1="0" x2="0" y2="1">' +
             '<stop offset="0" stop-color="#8ebfe6" />' +
             '<stop offset="1" stop-color="#5a92c4" /></linearGradient></defs>');

    svg.push('<g fill="url(#mapLandGrad)">');
    data.countries.forEach(function (country) {
      svg.push('<path class="map__land" d="' + country.d + '" />');
    });
    svg.push("</g>");

    // Ruta invisible: solo sirve para calcular posiciones y ángulos
    svg.push('<path class="map__route" fill="none" stroke="none" />');
    svg.push('<g class="map__trail"></g>');
    svg.push(marker("map__origin", mad, 9, 5.5));
    // Chinchetas de los puntos del camino (se colocan en cada vuelo)
    for (var i = 0; i < MAX_STOPS; i++) {
      svg.push(marker("map__stop", mad, 13, 6));
    }
    // El destino se marca más grande: el avión aterriza justo encima
    svg.push(marker("map__target", cph, 15, 6.5));
    svg.push('<g class="map__plane"><path d="' + PLANE_PATH + '" /></g>');
    svg.push("</svg>");

    return svg.join("");
  }

  function marker(cls, point, ring, dot) {
    return '<g class="' + cls + '">' +
      '<circle class="map__ring" cx="' + point[0] + '" cy="' + point[1] + '" r="' + ring + '" />' +
      '<circle class="map__dot" cx="' + point[0] + '" cy="' + point[1] + '" r="' + dot + '" />' +
      "</g>";
  }

  // Coloca una etiqueta HTML sobre su ciudad (en % del mapa)
  function placePin(el, point, data) {
    if (!el || !point) return;
    el.style.left = (point[0] / data.width * 100).toFixed(2) + "%";
    el.style.top = (point[1] / data.height * 100).toFixed(2) + "%";
  }

  // Mueve una chincheta del SVG (sus círculos) a otro punto
  function moveMarker(group, point) {
    if (!group) return;
    var circles = group.getElementsByTagName("circle");
    for (var i = 0; i < circles.length; i++) {
      circles[i].setAttribute("cx", round(point[0]));
      circles[i].setAttribute("cy", round(point[1]));
    }
  }

  // Recorrido aleatorio Madrid → Italia (tirabuzón) → rodeo → Copenhague
  function buildFlight(data) {
    var center = jitterPoint(data.cities[pick(ITALY_STOPS)], 34);
    var radius = 46 + Math.random() * 14;
    var points = [[data.cities.MAD[0], data.cities.MAD[1]]];
    var before = [];   // puntos del camino antes del tirabuzón…
    var after = [];    // … y después

    // 1) Acercamiento a Italia por el Mediterráneo o por Francia
    pick(LEGS_TO_ITALY).forEach(function (code) {
      var point = addCity(points, data, code, 44);
      if (point) before.push(point);
    });

    // 2) El tirabuzón: entra por el oeste y sale hacia el norte
    points = points.concat(corkscrew(
      center,
      radius,
      1.25 + Math.random() * 0.6,           // vueltas completas
      Math.random() < 0.5 ? 1 : -1,         // sentido del giro
      Math.PI * (0.85 + Math.random() * 0.3),
      [jitter(30), -18 - Math.random() * 16]
    ));

    // 3) Rodeo hacia el norte, con un rizo extra de propina de vez en cuando
    var north = pick(LEGS_TO_CPH).slice();
    if (north.length > 4) {
      north.splice(Math.floor(Math.random() * (north.length - 1)) + 1, 1);
    }
    // Nunca en el último punto: un rizo pegado a Copenhague la delataría
    var extraLoop = Math.random() < 0.5
      ? Math.floor(Math.random() * Math.max(1, north.length - 1))
      : -1;
    north.forEach(function (code, i) {
      var city = data.cities[code];
      if (!city) return;
      if (i === extraLoop) {
        points = points.concat(corkscrew(
          jitterPoint(city, 30), 26 + Math.random() * 14, 1,
          Math.random() < 0.5 ? 1 : -1, Math.random() * Math.PI * 2, [0, -10]
        ));
      } else {
        var point = addCity(points, data, code, 44);
        if (point) after.push(point);
      }
    });

    // 4) Aterrizaje
    points.push([data.cities.CPH[0], data.cities.CPH[1]]);

    return {
      d: smoothPath(addWobble(points)),
      italy: { center: center, radius: radius },
      stops: chooseStops(before, after, center, radius, data)
    };
  }

  function addCity(points, data, code, spread) {
    var city = data.cities[code];
    if (!city) return null;
    var point = jitterPoint(city, spread);
    points.push(point);
    return point;
  }

  // Elige los puntos que se iluminarán: el del tirabuzón y un par del camino.
  // El reparto (cuántos antes y cuántos después) cambia en cada vuelo, así el
  // de Italia no es siempre ni el primero ni el último en encenderse.
  function chooseStops(before, after, center, radius, data) {
    // Solo valen puntos despejados: pegados al rizo, a Madrid o a Copenhague
    // se solaparían con las chinchetas que ya hay ahí.
    function isClear(point) {
      return dist(point, center) > radius * 2.4 &&
             dist(point, data.cities.MAD) > 90 &&
             dist(point, data.cities.CPH) > 90;
    }
    var head = before.filter(isClear);
    var tail = after.filter(isClear);

    var take = Math.min(Math.floor(Math.random() * MAX_STOPS), head.length);
    var rest = Math.min(MAX_STOPS - 1 - take, tail.length);
    take = Math.min(head.length, MAX_STOPS - 1 - rest);   // reparte lo que sobre

    return sample(head, take).map(waypointStop)
      .concat([{ point: center, near: radius * 1.5, far: radius * 2.9 }])
      .concat(sample(tail, rest).map(waypointStop));
  }

  function dist(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function waypointStop(point) {
    return { point: point, near: 46, far: 82 };
  }

  // Coge `count` elementos al azar de la lista, en el orden del recorrido
  function sample(list, count) {
    var pool = list.slice();
    var picked = [];
    while (picked.length < count && pool.length) {
      picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return list.filter(function (item) { return picked.indexOf(item) !== -1; });
  }

  // Vueltas alrededor de un punto que se van cerrando y desplazando: el
  // trazo no se pisa a sí mismo y queda un tirabuzón.
  function corkscrew(center, radius, turns, dir, startAngle, drift) {
    var points = [];
    var steps = Math.max(8, Math.round(turns * 8));  // un punto cada 45°
    for (var i = 0; i <= steps; i++) {
      var k = i / steps;
      var angle = startAngle + dir * turns * 2 * Math.PI * k;
      var r = radius * (1 - 0.3 * k);
      points.push([
        center[0] + Math.cos(angle) * r + drift[0] * k,
        center[1] + Math.sin(angle) * r + drift[1] * k
      ]);
    }
    return points;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function jitter(range) {
    return (Math.random() - 0.5) * range;
  }

  function jitterPoint(point, range) {
    return [point[0] + jitter(range), point[1] + jitter(range)];
  }

  // Desvía un poco el centro de los tramos largos: la ruta hace eses suaves
  // y así no se adivina hacia dónde va el avión.
  function addWobble(pts) {
    var out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var from = pts[i - 1];
      var to = pts[i];
      var dx = to[0] - from[0];
      var dy = to[1] - from[1];
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len > 90) {
        var off = jitter(Math.min(70, len * 0.28));
        out.push([
          (from[0] + to[0]) / 2 - dy / len * off,
          (from[1] + to[1]) / 2 + dx / len * off
        ]);
      }
      out.push(to);
    }
    return out;
  }

  // Catmull-Rom → curvas cúbicas: pasa por todos los puntos sin picos
  function smoothPath(pts) {
    var d = "M" + round(pts[0][0]) + "," + round(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      d += "C" + round(p1[0] + (p2[0] - p0[0]) / 6) + "," + round(p1[1] + (p2[1] - p0[1]) / 6) +
           " " + round(p2[0] - (p3[0] - p1[0]) / 6) + "," + round(p2[1] - (p3[1] - p1[1]) / 6) +
           " " + round(p2[0]) + "," + round(p2[1]);
    }
    return d;
  }

  function round(n) {
    return Math.round(n * 10) / 10;
  }

  // Trocea la ruta en trazos discontinuos (la estela del avión)
  function buildDashes(path, total, group) {
    while (group.firstChild) group.removeChild(group.firstChild);

    var dashes = [];
    for (var at = 4; at + DASH_LEN < total; at += DASH_LEN + DASH_GAP) {
      var from = path.getPointAtLength(at);
      var to = path.getPointAtLength(at + DASH_LEN);
      var line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("class", "map__dash");
      line.setAttribute("x1", from.x.toFixed(1));
      line.setAttribute("y1", from.y.toFixed(1));
      line.setAttribute("x2", to.x.toFixed(1));
      line.setAttribute("y2", to.y.toFixed(1));
      group.appendChild(line);
      dashes.push({ el: line, at: at + DASH_LEN });
    }
    return dashes;
  }

  // Confeti pequeñito justo donde aterriza el avión
  function landingConfetti(host, data) {
    if (typeof window.confetti !== "function" || prefersReducedMotion) return;

    var box = host.getBoundingClientRect();
    if (!box.width || !box.height) return;

    window.confetti({
      particleCount: 45,
      spread: 70,
      startVelocity: 26,
      scalar: 0.8,
      colors: PALETTE,
      origin: {
        x: (box.left + box.width * data.cities.CPH[0] / data.width) / window.innerWidth,
        y: (box.top + box.height * data.cities.CPH[1] / data.height) / window.innerHeight,
      },
    });
  }

  // --------------------------------------------------------------
  // 5) Animaciones al hacer scroll
  // --------------------------------------------------------------
  function initScrollReveal() {
    var items = document.querySelectorAll(".reveal-on-scroll");
    if (!items.length) return;

    // Sin IntersectionObserver (o sin movimiento): mostrar todo directamente
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      items.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  // --------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    initGift();
    initCountdown();
    initFlight();
    initScrollReveal();
  });
})();

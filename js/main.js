/* =================================================================
   Lógica de la felicitación
   - Abrir el regalo (+ confeti)
   - Contador de días que faltan para el viaje
   - Animaciones de aparición al hacer scroll
================================================================= */
(function () {
  "use strict";

  // ✏️ EDITAR: fechas del viaje (año, mes 1-12, día)
  var TRIP_START = { y: 2026, m: 8, d: 30 }; // 30 de agosto de 2026
  var TRIP_END   = { y: 2026, m: 9, d: 2 };  // 2 de septiembre de 2026

  var prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    var colors = ["#d8402f", "#f0a92b", "#2c6e9b", "#3e7c5a", "#ffffff"];

    // Ráfaga central
    window.confetti({
      particleCount: 140,
      spread: 90,
      startVelocity: 45,
      origin: { y: 0.6 },
      colors: colors,
    });
    // Ráfagas laterales para dar volumen
    window.setTimeout(function () {
      window.confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 }, colors: colors });
      window.confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 }, colors: colors });
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
  // 4) Animaciones al hacer scroll
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
    initScrollReveal();
  });
})();

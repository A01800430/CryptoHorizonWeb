/**
 * Script para mejorar la experiencia de navegación al hacer scroll.
 * - Oculta la barra de navegación al bajar y la muestra al subir.
 * - Muestra un botón flotante para volver al inicio cuando el scroll es alto.
 */

let lastScroll = 0;
const nav = document.querySelector('.menu-container');
const scrollUpBtn = document.getElementById('scrollUpBtn');

// Detectar evento de scroll
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  // Ocultar navbar si el usuario baja, mostrar si sube
  if (currentScroll > lastScroll && currentScroll > 100) {
    nav.classList.add('hide');
  } else {
    nav.classList.remove('hide');
  }
  lastScroll = currentScroll;

  // Mostrar botón "scroll up" si el scroll es suficientemente alto
  if (currentScroll > 300) {
    scrollUpBtn.classList.add('show');
  } else {
    scrollUpBtn.classList.remove('show');
  }
});

// Subir al principio suavemente al hacer click en el botón
scrollUpBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
